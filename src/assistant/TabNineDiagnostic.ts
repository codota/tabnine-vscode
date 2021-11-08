import * as vscode from "vscode";
import { Range } from "./Range";
import { Completion } from "./Completion";


export default class TabNineDiagnostic extends vscode.Diagnostic {
  choices: Completion[] = [];

  reference: string;

  references: vscode.Range[] = [];

  assistantRange: Range;

  responseId: string;

  threshold: string;

  constructor(
    range: vscode.Range,
    message: string,
    choices: Completion[],
    reference: string,
    vscodeReferencesRange: vscode.Range[],
    assistantRange: Range,
    responseId: string,
    threshold: string,
    severity?: vscode.DiagnosticSeverity
  ) {
    super(range, message, severity);
    this.choices = choices;
    this.reference = reference;
    this.references = vscodeReferencesRange;
    this.assistantRange = assistantRange;
    this.responseId = responseId;
    this.threshold = threshold;
  }
}
