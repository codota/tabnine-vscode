import {
  DecorationOptions,
  Range,
  TextEditor,
  TextEditorDecorationType,
  window,
} from "vscode";

// eslint-disable-next-line import/prefer-default-export
export const setDecoration = (
  decorationType: TextEditorDecorationType,
  rangesOrOptions: Range[] | DecorationOptions[],
  editor?: TextEditor
): void =>
  (editor ?? window.activeTextEditor)?.setDecorations(
    decorationType,
    rangesOrOptions
  );
