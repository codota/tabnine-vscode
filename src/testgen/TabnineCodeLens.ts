import { CodeLens, Position, Range } from "vscode";

export default class TabnineCodeLens extends CodeLens {
  constructor(
    range: Range,
    public readonly block: string,
    public readonly filename: string,
    public readonly blockRange: Range,
    public readonly text: string,
    public readonly languageId: string,
    public readonly startPosition: Position
  ) {
    super(range);
  }
}
