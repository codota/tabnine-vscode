import {
  DecorationOptions,
  Range,
  TextEditorDecorationType,
  window,
} from "vscode";

// eslint-disable-next-line import/prefer-default-export
export const setDecoration = (
  decorationType: TextEditorDecorationType,
  rangesOrOptions: Range[] | DecorationOptions[]
): void =>
  window.activeTextEditor?.setDecorations(decorationType, rangesOrOptions);
