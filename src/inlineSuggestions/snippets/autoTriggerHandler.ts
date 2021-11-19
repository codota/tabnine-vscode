import { EOL } from "os";
import { TextDocumentChangeEvent } from "vscode";
import { SnippetRequestTrigger } from "../../binary/requests/requests";
import getCurrentPosition from "../positionExtracter";
import { isInSnippetInsertion } from "./blankSnippet";
import requestSnippet from "./snippetProvider";

export default async function snippetAutoTriggerHandler({
  document,
  contentChanges,
}: TextDocumentChangeEvent): Promise<void> {
  const [change] = contentChanges;
  const position = getCurrentPosition(change);
  const hasNewlines = change.text.includes(EOL);
  const currentLineIsEmpty = document.lineAt(position.line).text.trim() === "";

  if (!isInSnippetInsertion() && hasNewlines && currentLineIsEmpty) {
    await requestSnippet(document, position, SnippetRequestTrigger.Auto);
  }
}
