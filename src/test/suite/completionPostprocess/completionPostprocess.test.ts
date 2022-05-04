import { describe, it } from "mocha";
import postprocess from "../../../binary/requests/completionPostProcess";
import {
  expectResult,
  nonSnippetResult,
  request,
  snippetResult,
} from "./driver";

describe("CompletionPostprocess", () => {
  describe("Tabs", () => {
    it("should trim correctly and reindent where indentation is reseeding", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n\t\treturn x\n\t.return None\ndef b():\n\treturn 3"
      );
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None"
      );
    });

    it("should reindent and not trim where indentation is not reseeding", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n\t\treturn x\n\t.return None"
      );
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None"
      );
    });

    it("should reindent and not trim where request indentation is zero", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n\t\treturn x\n\t.return None\ndef b():\n\treturn 3"
      );
      postprocess(request("def a():\n"), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None\ndef b():\n  return 3"
      );
    });

    it("should do nothing where response is not a snippet", () => {
      const newPrefix =
        "if x > 2:\n\t\treturn x\n\t.return None\ndef b():\n\treturn 3";
      const autocompleteResult = nonSnippetResult(newPrefix);
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(autocompleteResult, newPrefix);
    });

    it("should do nothing where response is one line", () => {
      const newPrefix = "return 3";
      const autocompleteResult = snippetResult(newPrefix);
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(autocompleteResult, newPrefix);
    });
  });

  describe("Spaces", () => {
    it("should trim correctly and reindent where indentation is reseeding", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n    return x\n  .return None\ndef b():\n  return 3"
      );
      postprocess(request("def a():\n  "), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None"
      );
    });

    it("should reindent and not trim where indentation is not reseeding", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n    return x\n  .return None"
      );
      postprocess(request("def a():\n  "), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None"
      );
    });

    it("should reindent and not trim where request indentation is zero", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n    return x\n  .return None\ndef b():\n  return 3"
      );
      postprocess(request("def a():\n"), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None\ndef b():\n  return 3"
      );
    });

    it("should do nothing where response is not a snippet", () => {
      const newPrefix =
        "if x > 2:\n    return x\n  .return None\ndef b():\n  return 3";
      const autocompleteResult = nonSnippetResult(newPrefix);
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(autocompleteResult, newPrefix);
    });

    it("should do nothing where response is one line", () => {
      const newPrefix = "return 3";
      const autocompleteResult = snippetResult(newPrefix);
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(autocompleteResult, newPrefix);
    });
  });

  describe("Mixed", () => {
    it("should trim correctly and reindent where indentation is reseeding", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n  \treturn x\n  .return None\ndef b():\n\treturn 3"
      );
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None"
      );
    });

    it("should reindent and not trim where indentation is not reseeding", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n\t  return x\n\t.return None"
      );
      postprocess(request("def a():\n  "), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None"
      );
    });

    it("should reindent and not trim where request indentation is zero", () => {
      const autocompleteResult = snippetResult(
        "if x > 2:\n    return x\n\t.return None\ndef b():\n  return 3"
      );
      postprocess(request("def a():\n"), autocompleteResult, 2);

      expectResult(
        autocompleteResult,
        "if x > 2:\n    return x\n  .return None\ndef b():\n  return 3"
      );
    });

    it("should do nothing where response is not a snippet", () => {
      const newPrefix =
        "if x > 2:\n\t  return x\n\t.return None\ndef b():\n  return 3";
      const autocompleteResult = nonSnippetResult(newPrefix);
      postprocess(request("def a():\n  "), autocompleteResult, 2);

      expectResult(autocompleteResult, newPrefix);
    });

    it("should do nothing where response is one line", () => {
      const newPrefix = "return 3";
      const autocompleteResult = snippetResult(newPrefix);
      postprocess(request("def a():\n\t"), autocompleteResult, 2);

      expectResult(autocompleteResult, newPrefix);
    });
  });
});
