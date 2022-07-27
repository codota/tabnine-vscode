import * as path from "path";
import { Position, Range, Uri, window } from "vscode";
import {
  Capability,
  isAnyCapabilityEnabled,
} from "./capabilities/capabilities";

const logoPath = Uri.file(path.resolve(__dirname, "..", "small_logo-mono.png"));

const type = window.createTextEditorDecorationType({
  gutterIconPath: logoPath,
});

export default function attribute(position: Position): void {
  if (
    isAnyCapabilityEnabled(Capability.ATTRIBUTION, Capability.ALPHA_CAPABILITY)
  ) {
    window.activeTextEditor?.setDecorations(type, [
      new Range(position.line, 0, position.line, 0),
    ]);
  }
}

window.onDidChangeTextEditorSelection(() => {
  window.activeTextEditor?.setDecorations(type, []);
});
