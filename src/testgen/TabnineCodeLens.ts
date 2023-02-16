import { CodeLens, Position, Range } from "vscode";

export default class TabnineCodeLens extends CodeLens {
  constructor(
    range: Range,
    public readonly code: string,
    public readonly fileName: string,
    public readonly blockRange: Range,
    public readonly text: string,
    public readonly languageId: string,
    public readonly startPosition: Position
  ) {
    super(range);
  }
}
