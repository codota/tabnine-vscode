import { describe, it } from "mocha";
import * as assert from "assert";
import { buildLocalCommitMessage } from "./localCommitMessage";
import { resolveCommitMessageLanguage } from "./commitMessageSettings";

const singleFileDiff = `diff --git a/src/auth/login.ts b/src/auth/login.ts
index 111..222 100644
--- a/src/auth/login.ts
+++ b/src/auth/login.ts
@@ -1,3 +1,6 @@
+export function login() {
+  return true;
+}
`;

describe("localCommitMessage", () => {
  it("generates a conventional commit from a single-file diff", () => {
    const message = buildLocalCommitMessage(singleFileDiff, {
      convention: "conventional",
      language: "en",
      customInstructions: "",
    });

    assert.ok(message.startsWith("feat(auth):"));
    assert.ok(message.toLowerCase().includes("login"));
  });

  it("resolves auto from vscode display language", () => {
    assert.strictEqual(resolveCommitMessageLanguage("auto", "pt-br"), "pt-br");
    assert.strictEqual(resolveCommitMessageLanguage("auto", "fr"), "fr");
  });
});
