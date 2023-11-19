import {
  commands,
  ExtensionContext,
  languages,
  Range,
  Selection,
  window,
} from "vscode";

import ChatCodeLensProvider from "./ChatCodeLensProvider";
import ChatViewProvider from "../../ChatViewProvider";
import tabnineExtensionProperties from "../../../globals/tabnineExtensionProperties";

const languagesFilter = [
  { language: "javascript" },
  { language: "typescript" },
  { language: "javascriptreact" },
  { language: "typescriptreact" },
  { language: "python" },
  { language: "ruby" },
  { language: "go" },
  { language: "rust" },
  { language: "swift" },
  { language: "java" },
  { language: "c" },
  { language: "cpp" },
  { language: "csharp" },
  { language: "php" },
];
export default function registerChatCodeLens(
  context: ExtensionContext,
  chatProvider: ChatViewProvider
) {
  if (!tabnineExtensionProperties.codeLensEnabled) {
    return;
  }
  context.subscriptions.push(
    languages.registerCodeLensProvider(
      languagesFilter,
      new ChatCodeLensProvider()
    ),
    commands.registerCommand(
      "tabnine.chat.commands.any",
      (range: Range, intent: string) => {
        const editor = window.activeTextEditor;
        if (editor) {
          const newSelection = new Selection(range.start, range.end);
          editor.selection = newSelection;
        }
        void chatProvider.handleMessageSubmitted(`/${intent}`);
      }
    ),
    commands.registerCommand("tabnine.chat.commands.ask", (range: Range) => {
      const editor = window.activeTextEditor;
      if (editor) {
        const newSelection = new Selection(range.start, range.end);
        editor.selection = newSelection;
      }
      void window
        .showInputBox({
          prompt: "ask tabnine",
          ignoreFocusOut: true,
        })
        .then((question) => {
          if (question) {
            void chatProvider.handleMessageSubmitted(question);
          }
        });
    })
  );
}
