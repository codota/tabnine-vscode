/* eslint-disable no-param-reassign */
import {
  Disposable,
  Range,
  Selection,
  SymbolInformation,
  TextEditor,
  commands,
  window,
} from "vscode";
import ChatViewProvider from "../ChatViewProvider";
import { getFuctionsSymbols } from "./getFuctionsSymbols";
import { COMANDS, Intent } from "./commands";
import { showInput } from "./showInput";
import { fireEvent } from "../../binary/requests/requests";

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
        void showInput(COMANDS).then((result) => {
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

            if (result) {
              void fireEvent({
                name: "chat-ide-action",
                intent: result,
                language: window.activeTextEditor?.document.languageId,
              });
              void chatProvider.handleMessageSubmitted(result);
            }
          }
        });
      }
    ),
    commands.registerCommand(
      "tabnine.chat.commands.any",
      (range: Range, intent: Intent) => {
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
        void chatProvider.handleMessageSubmitted(intent);
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
      void showInput(COMANDS).then((question) => {
        if (question) {
          void chatProvider.handleMessageSubmitted(question);
        }
      });
    })
  );
}

function contextActionHandler(
  chatProvider: ChatViewProvider,
  textEditor: TextEditor,
  intent: string
): void {
  void fireEvent({
    name: "chat-ide-action",
    intent,
    language: window.activeTextEditor?.document.languageId,
  });
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
