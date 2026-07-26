import { suite, it, afterEach } from "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as requests from "../../binary/requests/requests";
import * as api from "../../tabnineCommitMessageWidget/api";
import {
  hasChanges,
  GitRepository,
} from "../../tabnineCommitMessageWidget/gitApi";
import { buildLocalCommitMessage } from "../../tabnineCommitMessageWidget/localCommitMessage";
import {
  CommitMessageOptions,
  resolveCommitMessageLanguage,
} from "../../tabnineCommitMessageWidget/commitMessageSettings";
import {
  commitMessageText,
  generateCommitMessageWithTabnine,
  TabnineAuthError,
} from "../../tabnineCommitMessageWidget/tabnineChatClient";

const loginDiff = `diff --git a/src/auth/login.ts b/src/auth/login.ts
index 111..222 100644
--- a/src/auth/login.ts
+++ b/src/auth/login.ts
@@ -1,3 +1,6 @@
+export function login() {
+  return true;
+}
`;

const testDiff = `diff --git a/src/auth/login.test.ts b/src/auth/login.test.ts
index 111..222 100644
--- a/src/auth/login.test.ts
+++ b/src/auth/login.test.ts
@@ -1,2 +1,5 @@
+it("logs in", () => {
+  expect(true).toBe(true);
+});
`;

const docsDiff = `diff --git a/README.md b/README.md
index 111..222 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,3 @@
+# Docs
`;

const chatOptions: CommitMessageOptions = {
  enabled: true,
  convention: "conventional",
  language: "en",
  languageSetting: "en",
  customInstructions: "",
};

function repositoryWith(partial: {
  indexChanges?: unknown[];
  workingTreeChanges?: unknown[];
  mergeChanges?: unknown[];
}): GitRepository {
  return {
    rootUri: undefined as never,
    inputBox: { value: "" },
    state: {
      indexChanges: (partial.indexChanges ?? []) as never,
      workingTreeChanges: (partial.workingTreeChanges ?? []) as never,
      mergeChanges: (partial.mergeChanges ?? []) as never,
    },
    diff: async () => "",
    status: async () => undefined,
  };
}

suite("tabnineCommitMessageWidget", () => {
  suite("localCommitMessage", () => {
    it("generates a conventional commit from a single-file diff", () => {
      const message = buildLocalCommitMessage(loginDiff, {
        convention: "conventional",
        language: "en",
        customInstructions: "",
      });

      expect(message.startsWith("feat(auth):")).to.equal(true);
      expect(message.toLowerCase()).to.include("login");
    });

    it("prefers test type for test files", () => {
      const message = buildLocalCommitMessage(testDiff, {
        convention: "conventional",
        language: "en",
        customInstructions: "",
      });

      expect(message.startsWith("test")).to.equal(true);
    });

    it("prefers docs type for markdown files", () => {
      const message = buildLocalCommitMessage(docsDiff, {
        convention: "conventional",
        language: "en",
        customInstructions: "",
      });

      expect(message.startsWith("docs")).to.equal(true);
    });

    it("supports portuguese subjects", () => {
      const message = buildLocalCommitMessage(loginDiff, {
        convention: "conventional",
        language: "pt-br",
        customInstructions: "",
      });

      expect(message).to.include("adicionar");
    });

    it("supports simple convention", () => {
      const message = buildLocalCommitMessage(loginDiff, {
        convention: "simple",
        language: "en",
        customInstructions: "",
      });

      expect(message.startsWith("feat")).to.equal(false);
      expect(message.toLowerCase()).to.include("login");
    });

    it("supports gitmoji convention", () => {
      const message = buildLocalCommitMessage(loginDiff, {
        convention: "gitmoji",
        language: "en",
        customInstructions: "",
      });

      expect(message.startsWith("✨")).to.equal(true);
    });

    it("applies custom instructions with placeholder", () => {
      const message = buildLocalCommitMessage(loginDiff, {
        convention: "simple",
        language: "en",
        customInstructions: "ABC-123: {message}",
      });

      expect(message.startsWith("ABC-123:")).to.equal(true);
      expect(message.toLowerCase()).to.include("login");
    });

    it("appends custom instructions as body when placeholder is missing", () => {
      const message = buildLocalCommitMessage(loginDiff, {
        convention: "simple",
        language: "en",
        customInstructions: "Signed-off-by: Dev",
      });

      expect(message).to.include("Signed-off-by: Dev");
      expect(message).to.include("\n\n");
    });
  });

  suite("commitMessageSettings", () => {
    it("resolves auto from vscode display language", () => {
      expect(resolveCommitMessageLanguage("auto", "pt-br")).to.equal("pt-br");
      expect(resolveCommitMessageLanguage("auto", "fr")).to.equal("fr");
      expect(resolveCommitMessageLanguage("auto", "de")).to.equal("de");
    });

    it("keeps an explicit language even when vscode language differs", () => {
      expect(resolveCommitMessageLanguage("de", "en")).to.equal("de");
      expect(resolveCommitMessageLanguage("ja", "pt-br")).to.equal("ja");
    });

    it("normalizes locale variants", () => {
      expect(resolveCommitMessageLanguage("auto", "pt-PT")).to.equal("pt-br");
      expect(resolveCommitMessageLanguage("auto", "pt_BR")).to.equal("pt-br");
      expect(resolveCommitMessageLanguage("auto", "zh-hans")).to.equal("zh-cn");
      expect(resolveCommitMessageLanguage("auto", "zh-hant")).to.equal("zh-tw");
      expect(resolveCommitMessageLanguage("auto", "zh")).to.equal("zh-cn");
    });

    it("falls back to english for unknown locales", () => {
      expect(resolveCommitMessageLanguage("auto", "xx-YY")).to.equal("en");
      expect(resolveCommitMessageLanguage("auto", "")).to.equal("en");
    });
  });

  suite("gitApi", () => {
    it("detects staged changes", () => {
      expect(
        hasChanges(
          repositoryWith({
            indexChanges: [{}],
          })
        )
      ).to.equal(true);
    });

    it("detects working tree changes", () => {
      expect(
        hasChanges(
          repositoryWith({
            workingTreeChanges: [{}],
          })
        )
      ).to.equal(true);
    });

    it("returns false when there are no changes", () => {
      expect(hasChanges(repositoryWith({}))).to.equal(false);
    });
  });

  suite("tabnineChatClient text helpers", () => {
    it("parses streamed NDJSON chunks", () => {
      const raw = [
        '{"value":{"text":"feat(auth): "}}',
        "not-json",
        '{"value":{"text":"add login"}}',
        "",
      ].join("\n");

      expect(commitMessageText.parseStreamText(raw)).to.equal(
        "feat(auth): add login"
      );
    });

    it("ignores malformed stream lines", () => {
      const raw = '{"value":{"text":"ok"}}\n{broken\n{"value":{"text":"!"}}';
      expect(commitMessageText.parseStreamText(raw)).to.equal("ok!");
    });

    it("sanitizes markdown fences and quotes", () => {
      expect(
        commitMessageText.sanitizeCommitMessage("```\nfeat: hello\n```")
      ).to.equal("feat: hello");
      expect(commitMessageText.sanitizeCommitMessage('"feat: hello"')).to.equal(
        "feat: hello"
      );
    });
  });

  suite("generateCommitMessageWithTabnine", () => {
    afterEach(() => {
      sinon.restore();
    });

    it("throws TabnineAuthError when there is no access token", async () => {
      sinon.stub(requests, "getState").resolves({
        is_logged_in: false,
      } as never);

      try {
        await generateCommitMessageWithTabnine("diff", chatOptions);
        expect.fail("expected TabnineAuthError");
      } catch (error) {
        expect(error).to.be.instanceOf(TabnineAuthError);
      }
    });

    it("orchestrates models, generation and stream wait", async () => {
      sinon.stub(requests, "getState").resolves({
        is_logged_in: true,
        access_token: "token",
      } as never);
      sinon.stub(api, "getModels").resolves({
        default: "model-1",
        models: [{ id: "model-1", isEnabled: true }],
      });
      const generateStub = sinon
        .stub(api, "generateChatResponseAsync")
        .resolves({
          streamId: "stream-1",
        });
      sinon
        .stub(api, "waitForStream")
        .resolves('{"value":{"text":"feat(auth): add login"}}');

      const message = await generateCommitMessageWithTabnine(
        "diff --git a/src/auth/login.ts b/src/auth/login.ts\n+login",
        chatOptions
      );

      expect(message).to.equal("feat(auth): add login");
      expect(generateStub.calledOnce).to.equal(true);
      expect(generateStub.firstCall.args[0]).to.equal("token");
      expect(generateStub.firstCall.args[1].modelId).to.equal("model-1");
    });

    it("throws when Tabnine returns an empty stream", async () => {
      sinon.stub(requests, "getState").resolves({
        is_logged_in: true,
        access_token: "token",
      } as never);
      sinon.stub(api, "getModels").resolves({ default: "model-1" });
      sinon.stub(api, "generateChatResponseAsync").resolves({
        streamId: "stream-1",
      });
      sinon.stub(api, "waitForStream").resolves("");

      try {
        await generateCommitMessageWithTabnine("diff", chatOptions);
        expect.fail("expected empty message error");
      } catch (error) {
        expect((error as Error).message).to.include("empty commit message");
      }
    });

    it("uses the first enabled model when default is missing", async () => {
      sinon.stub(requests, "getState").resolves({
        is_logged_in: true,
        access_token: "token",
      } as never);
      sinon.stub(api, "getModels").resolves({
        models: [
          { id: "disabled", isEnabled: false },
          { id: "enabled-model", isEnabled: true },
        ],
      });
      const generateStub = sinon
        .stub(api, "generateChatResponseAsync")
        .resolves({
          streamId: "stream-1",
        });
      sinon
        .stub(api, "waitForStream")
        .resolves('{"value":{"text":"chore: update"}}');

      await generateCommitMessageWithTabnine("diff", chatOptions);

      expect(generateStub.firstCall.args[1].modelId).to.equal("enabled-model");
    });
  });
});
