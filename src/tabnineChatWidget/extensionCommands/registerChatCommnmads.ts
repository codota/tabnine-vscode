/* eslint-disable no-param-reassign */
import {
  Disposable,
  Selection,
  SymbolInformation,
  TextEditor,
  commands,
} from "vscode";
import ChatViewProvider from "../ChatViewProvider";
import { getFuctionsSymbols } from "./getFuctionsSymbols";
import { SLASH_COMANDS } from "./slashCommands";
import { showInput } from "./showInput";

export function registerChatCommnmads(
  chatProvider: ChatViewProvider
): Disposable {
  return Disposable.from(
    commands.registerTextEditorCommand(
      "tabnine.chat.commands.explain-code",
      (textEditor: TextEditor) => {
        contextActionHandler(chatProvider, textEditor, "/explain-code");
      }
    ),
    commands.registerTextEditorCommand(
      "tabnine.chat.commands.generate-tests",
      (textEditor: TextEditor) => {
        contextActionHandler(chatProvider, textEditor, "/generate-tests");
      }
    ),
    commands.registerTextEditorCommand(
      "tabnine.chat.commands.document-code",
      (textEditor: TextEditor) => {
        contextActionHandler(chatProvider, textEditor, "/document-code");
      }
    ),
    commands.registerTextEditorCommand(
      "tabnine.chat.commands.fix-code",
      (textEditor: TextEditor) => {
        contextActionHandler(chatProvider, textEditor, "/fix-code");
      }
    ),
    commands.registerTextEditorCommand(
      "tabnine.chat.commands.inline.action",
      (textEditor: TextEditor) => {
        const items = SLASH_COMANDS.map(({ label, description }) => ({
          label,
          description,
        }));
        void showInput(items).then((result) => {
          const input =
            SLASH_COMANDS.find(({ label }) => label === result)?.intent ||
            result;

          if (textEditor.selection.isEmpty) {
            void getFuctionsSymbols(textEditor.document).then(
              (relevantSymbols: SymbolInformation[]) => {
                const symbolInRange = relevantSymbols?.find((s) =>
                  s.location.range.contains(textEditor.selection.active)
                );
                if (symbolInRange) {
                  const newSelection = new Selection(
                    symbolInRange.location.range.start,
                    symbolInRange.location.range.end
                  );
                  textEditor.selection = newSelection;
                }
              }
            );
          }

          if (input) {
            void chatProvider.handleMessageSubmitted(input);
          }
        });
      }
    )
  );
}

function contextActionHandler(
  chatProvider: ChatViewProvider,
  textEditor: TextEditor,
  intent: string
): void {
  if (textEditor.selection.isEmpty) {
    void getFuctionsSymbols(textEditor.document).then(
      (relevantSymbols: SymbolInformation[]) => {
        const symbolInRange = relevantSymbols?.find((s) =>
          s.location.range.contains(textEditor.selection)
        );

        if (symbolInRange) {
          const { range } = symbolInRange.location;

          const newSelection = new Selection(range.start, range.end);
          textEditor.selection = newSelection;
        }
        void chatProvider.handleMessageSubmitted(intent);
      }
    );
  } else {
    void chatProvider.handleMessageSubmitted(intent);
  }
}
