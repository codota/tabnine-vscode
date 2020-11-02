// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as TypeMoq from "typemoq";
import { activate, getDocUri } from "./helper";
import { stdinMock } from "../../binary/mockedRunProcess";
import * as path from "path";

type CompletionRequest = {
  version: string;
  request: {
    Autocomplete: {
      filename: string;
      before: string;
      after: string;
      region_includes_beginning: boolean;
      region_includes_end: boolean;
      max_num_results: number;
    };
  };
};

// Example autocomplete query:
//   '{"version":"2.0.2","request":{"Autocomplete":{"filename":"/Users/boazberman/Projects/Codota/tabnine-vscode/out/test/fixture/completion.txt","before":"blabla","after":"","region_includes_beginning":true,"region_includes_end":true,"max_num_results":5}}}\n';

suite("Should do completion", () => {
  const docUri = getDocUri("completion.txt");

  test("Passes the correct request to binary process on completion", async () => {
    await activate(docUri);

    await completion(docUri, new vscode.Position(0, 6));

    stdinMock.verify(
      (x) =>
        x.write(
          TypeMoq.It.is<string>((request) => {
            const completionRequest = JSON.parse(request) as CompletionRequest;

            return (
              request.endsWith("\n") &&
              completionRequest?.version === "2.0.2" &&
              completionRequest?.request?.Autocomplete?.filename?.endsWith(
                path.join("test", "fixture", "completion.txt")
              ) &&
              completionRequest?.request?.Autocomplete?.after === "" &&
              completionRequest?.request?.Autocomplete?.before === "blabla" &&
              completionRequest?.request?.Autocomplete
                ?.region_includes_beginning &&
              completionRequest?.request?.Autocomplete?.region_includes_end &&
              completionRequest?.request?.Autocomplete?.max_num_results === 5
            );
          }),
          "utf8"
        ),
      TypeMoq.Times.once()
    );
  });
});

function completion(
  docUri: vscode.Uri,
  position: vscode.Position
): Thenable<vscode.CompletionList<vscode.CompletionItem> | undefined> {
  return vscode.commands.executeCommand(
    "vscode.executeCompletionItemProvider",
    docUri,
    position
  );
}
