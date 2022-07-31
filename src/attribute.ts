import * as path from "path";
import { Position, Range, Uri, window } from "vscode";
import {
  Capability,
  isAnyCapabilityEnabled,
} from "./capabilities/capabilities";
import { setDecoration } from "./vscode.api";

const logoPath = Uri.file(path.resolve(__dirname, "..", "small_logo-mono.png"));

const type = window.createTextEditorDecorationType({
  gutterIconPath: logoPath,
  gutterIconSize: "70%",
});

export default function attribute(position: Position): void {
  console.log("attribute called");
  if (
    isAnyCapabilityEnabled(Capability.ATTRIBUTION, Capability.ALPHA_CAPABILITY)
  ) {
    drawDecorationAtCurrentLine(position);
  }
}

window.onDidChangeTextEditorSelection(clearDecoration);

function clearDecoration() {
  setDecoration(type, []);
}

function drawDecorationAtCurrentLine(position: Position): void {
  setDecoration(type, [new Range(position.line, 0, position.line, 0)]);
}
