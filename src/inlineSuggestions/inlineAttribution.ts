import * as path from "path";
import { Position, Range, Uri, window } from "vscode";
import {
  Capability,
  isAnyCapabilityEnabled,
} from "../capabilities/capabilities";
import { setDecoration } from "../vscode.api";

const logoPath = Uri.file(path.resolve(__dirname, "..", "small_logo-mono.png"));

const type = window.createTextEditorDecorationType({
  gutterIconPath: logoPath,
  gutterIconSize: "70%",
});

function clearDecoration() {
  setDecoration(type, []);
}

function drawDecorationAtCurrentLine(position: Position): void {
  setDecoration(type, [new Range(position.line, 0, position.line, 0)]);
}

function attribute(position: Position): void {
  console.log("attribute");
  if (
    isAnyCapabilityEnabled(Capability.ATTRIBUTION, Capability.ALPHA_CAPABILITY)
  ) {
    console.log("drawDecorationAtCurrentLine");
    drawDecorationAtCurrentLine(position);
  }
}

function init(): (position: Position) => void {
  window.onDidChangeTextEditorSelection(clearDecoration);
  return attribute;
}

export default init();
