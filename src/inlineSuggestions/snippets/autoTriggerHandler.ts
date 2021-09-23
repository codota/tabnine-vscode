import { EOL } from "os";
import {
  Position,
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
} from "vscode";
import { SnippetRequestTrigger } from "../../binary/requests/requests";
import { isInSnippetInsertion } from "./snippetDecoration";
import requestSnippet from "./snippetProvider";

export default async function snippetAutoTriggerHandler({
  document,
  contentChanges,
}: TextDocumentChangeEvent): Promise<void> {
  const [change] = contentChanges;
  const position = getCurrentPosition(change);
  if (
    !isInSnippetInsertion() &&
    change.text.includes(EOL) &&
    document.lineAt(position.line).text.trim() === ""
  ) {
    await requestSnippet(document, position, SnippetRequestTrigger.Auto);
  }
}

function getCurrentPosition(change: TextDocumentContentChangeEvent): Position {
  return change.range.start.translate(
    change.text.split(EOL).length - 1,
    -change.range.start.character
  );
}
