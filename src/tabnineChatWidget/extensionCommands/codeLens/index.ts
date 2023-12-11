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
import { fireEvent } from "../../../binary/requests/requests";
import { showInput } from "../showInput";
import { SLASH_COMANDS } from "../slashCommands";
import { languagesFilter } from "../const";

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
        void fireEvent({
          name: "chat-lens-action",
          intent,
          language: window.activeTextEditor?.document.languageId,
        });

        const editor = window.activeTextEditor;
        if (editor) {
          const newSelection = new Selection(range.start, range.end);
          editor.selection = newSelection;
        }
        void chatProvider.handleMessageSubmitted(`/${intent}`);
      }
    ),
    commands.registerCommand("tabnine.chat.commands.ask", (range: Range) => {
      void fireEvent({
        name: "chat-lens-action",
        intent: "ask-question",
        language: window.activeTextEditor?.document.languageId,
      });

      const editor = window.activeTextEditor;
      if (editor) {
        const newSelection = new Selection(range.start, range.end);
        editor.selection = newSelection;
      }
      void showInput(SLASH_COMANDS).then((question) => {
        if (question) {
          void chatProvider.handleMessageSubmitted(question);
        }
      });
    })
  );
}
