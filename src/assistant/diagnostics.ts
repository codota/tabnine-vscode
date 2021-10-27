/* eslint-disable */
import * as vscode from "vscode";
import { Mutex } from "await-semaphore";
import CancellationToken from "./CancellationToken";
import AssistantCodeActionProvider from "./AssistantCodeActionProvider";
import {
  getAssistantMode,
  setAssistantMode,
  AssistantMode,
} from "./AssistantMode";
import {
  getAssistantDiagnostics,
  Range,
  AssistantDiagnostic,
  getCompilerDiagnostics,
  getValidExtensions,
  getValidLanguages,
  Completion,
} from "./AssistantClient";
import { getNanoSecTime, getAPIKey, StateType } from "./utils";
import {
  ASSISTANT_IGNORE_REFRESH_COMMAND,
  ASSISTANT_MODE_TOGGLE_COMMAND,
  PASTE_COMMAND,
  ASSISTANT_SET_THRESHOLD_COMMAND,
} from "./commands";
import setState from "../binary/requests/setState";
import { StatePayload } from "../globals/consts";

export const TABNINE_DIAGNOSTIC_CODE = "TabNine";

let backgroundThreshold = "Medium";
const PASTE_THRESHOLD = "Paste";
const EDIT_DISTANCE = 2;

export class TabNineDiagnostic extends vscode.Diagnostic {
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

const decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: "RGBA(140, 198, 255, 0.25)",
  overviewRulerColor: "rgba(140, 198, 255, 1)",
  border: "1px solid RGBA(140, 198, 255, 1)",
  borderSpacing: "2px",
  borderRadius: "3px",
});

function setDecorators(diagnostics: vscode.Diagnostic[]) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const decorationsArray: vscode.DecorationOptions[] = [];
    diagnostics.forEach((d) => {
      const decoration = {
        range: d.range,
      };
      decorationsArray.push(decoration);
    });
    editor.setDecorations(decorationType, decorationsArray);
  }
}

function setStatusBarMessage(message: string, timeout = 30000) {
  new Promise<vscode.Disposable>((resolve) => {
    const disposable = vscode.window.setStatusBarMessage(`[ ${message} ]`);
    setTimeout(() => resolve(disposable), timeout);
  }).then((disposable) => disposable.dispose());
}

const mutex: Mutex = new Mutex();
const cancellationToken = new CancellationToken();

async function refreshDiagnostics(
  document: vscode.TextDocument,
  tabNineDiagnostics: vscode.DiagnosticCollection,
  visibleRanges: vscode.Range[]
): Promise<TabNineDiagnostic[] | undefined> {
  cancellationToken.cancel();
  const release = await mutex.acquire();
  cancellationToken.reset();
  try {
    let foundDiags = 0;
    const visibleRange = visibleRanges.reduce((accumulator, currentValue) =>
      accumulator.union(currentValue)
    );
    const start = document.offsetAt(visibleRange.start);
    const end = document.offsetAt(visibleRange.end);
    const threshold =
      getAssistantMode() === AssistantMode.Background
        ? backgroundThreshold
        : PASTE_THRESHOLD;
    const code = document.getText();
    const apiKey: string = await getAPIKey();
    if (cancellationToken.isCancelled()) {
      return undefined;
    }
    setStatusBarMessage("TabNine Assistant $(sync~spin)");
    const assistantDiagnostics: AssistantDiagnostic[] = await getAssistantDiagnostics(
      code,
      document.fileName,
      { start, end },
      threshold,
      EDIT_DISTANCE,
      apiKey,
      cancellationToken
    );
    if (cancellationToken.isCancelled()) {
      setStatusBarMessage("");
      return undefined;
    }
    if (assistantDiagnostics === null) {
      setStatusBarMessage("TabNine Assistant: error");
      return undefined;
    }
    const newTabNineDiagnostics: TabNineDiagnostic[] = [];
    for (const assistantDiagnostic of assistantDiagnostics) {
      if (cancellationToken.isCancelled()) {
        setStatusBarMessage("");
        return undefined;
      }
      const choices = assistantDiagnostic.completionList.filter(
        (completion) => completion.value !== state.reference
      );
      const choicesString = choices.map((completion) => {
        return `${completion.value}\t${completion.score}%`;
      });
      if (choices.length > 0) {
        const prevReferencesLocationsInRange = assistantDiagnostic.references.filter(
          (r) => r.start < assistantDiagnostic.range.start
        );
        const prevDiagnosticsForReferenceInRange = newTabNineDiagnostics.filter(
          (diag) => prevReferencesLocationsInRange.includes(diag.assistantRange)
        );

        // If we are in paste mode and one of the previouse reference was ok (no suggestions), don't suggest things on this reference.
        if (
          getAssistantMode() === AssistantMode.Background ||
          prevReferencesLocationsInRange.length === 0 || // no references before this point
          (prevReferencesLocationsInRange.length > 0 &&
            prevDiagnosticsForReferenceInRange.length > 0)
        ) {
          // there are references before this point. and we have diagnostics for them
          const vscodeRange = new vscode.Range(
            document.positionAt(assistantDiagnostic.range.start),
            document.positionAt(assistantDiagnostic.range.end)
          );
          const vscodeReferencesRange: vscode.Range[] = assistantDiagnostic.references.map(
            (r) =>
              new vscode.Range(
                document.positionAt(r.start),
                document.positionAt(r.end)
              )
          );
          const diagnostic = new TabNineDiagnostic(
            vscodeRange,
            `Did you mean:\n${choicesString.join("\n")} `,
            choices,
            assistantDiagnostic.reference,
            vscodeReferencesRange,
            assistantDiagnostic.range,
            assistantDiagnostic.responseId,
            threshold,
            vscode.DiagnosticSeverity.Information
          );
          diagnostic.code = TABNINE_DIAGNOSTIC_CODE;
          newTabNineDiagnostics.push(diagnostic);
          foundDiags += 1;
        }
      }
    }
    if (newTabNineDiagnostics.length > 0) {
      setState({
        AssistantState: {
          num_of_diagnostics: newTabNineDiagnostics.length,
          num_of_locations: assistantDiagnostics.length,
        },
      });
    }
    setDecorators(newTabNineDiagnostics);
    tabNineDiagnostics.set(document.uri, newTabNineDiagnostics);
    const message = `TabNine Assistant found ${foundDiags} suspicious spot${
      foundDiags !== 1 ? "s" : ""
    }`;
    console.log(message);
    setStatusBarMessage(message);
    return newTabNineDiagnostics;
  } catch (e) {
    console.error(`TabNine Assistant: error - ${e.message}`);
  } finally {
    release();
  }

  return undefined;
}

let state: {
  document?: vscode.TextDocument;
  diagnostics?: vscode.DiagnosticCollection;
  ranges?: vscode.Range[];
  timestamp?: number;
  // FIXME: This member is referenced but never set.... Check the code that uses it.
  reference?: unknown;
} = {};

async function refreshDiagnosticsWrapper(
  document: vscode.TextDocument,
  diagnostics: vscode.DiagnosticCollection,
  ranges: vscode.Range[],
  sleep = 500
) {
  const timestamp = getNanoSecTime();
  state = {
    document,
    diagnostics,
    ranges,
    timestamp,
  };
  await new Promise((resolve) => setTimeout(resolve, sleep));
  if (state.timestamp === timestamp) {
    refreshDiagnostics(state.document!, state.diagnostics!, state.ranges!);
  }
}

function refreshDiagsOrPrefetch(
  document: vscode.TextDocument,
  tabNineDiagnostics: vscode.DiagnosticCollection
) {
  if (getAssistantMode() === AssistantMode.Background) {
    refreshDiagnostics(
      document,
      tabNineDiagnostics,
      vscode.window.activeTextEditor!.visibleRanges
    );
  } else {
    // prefetch diagnostics (getAssistantMode() == Mode.Paste)
    getCompilerDiagnostics(document.getText(), document.fileName);
  }
}

export async function registerAssistant(
  context: vscode.ExtensionContext,
  pasteDisposable: vscode.Disposable
): Promise<void> {
  const tabNineDiagnostics = vscode.languages.createDiagnosticCollection(
    "tabNine"
  );
  context.subscriptions.push(tabNineDiagnostics);

  const validLanguages = await getValidLanguages();
  const validExtensions = await getValidExtensions();

  const validDocument = (document: vscode.TextDocument) => {
    const { fileName } = document;
    const fileExt = `.${fileName.split(".").pop()}`;
    return (
      validExtensions.includes(fileExt) &&
      validLanguages.includes(document.languageId)
    );
  };

  vscode.commands.registerTextEditorCommand(
    ASSISTANT_MODE_TOGGLE_COMMAND,
    async () => {
      cancellationToken.cancel();
      tabNineDiagnostics.delete(vscode.window.activeTextEditor!.document.uri);
      setDecorators([]);
      const newMode =
        getAssistantMode() === AssistantMode.Background
          ? AssistantMode.Paste
          : AssistantMode.Background;
      setAssistantMode(newMode);

      if (getAssistantMode() === AssistantMode.Paste) {
        vscode.window.showInformationMessage("TabNine Assistant Paste mode");
        console.log("Paste validation mode");
      } else {
        vscode.window.showInformationMessage(
          "TabNine Assistant Background mode"
        );
        console.log("Background validation mode");
      }

      if (
        vscode.window.activeTextEditor &&
        validDocument(vscode.window.activeTextEditor.document)
      ) {
        refreshDiagsOrPrefetch(
          vscode.window.activeTextEditor.document,
          tabNineDiagnostics
        );
      }
    }
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor && validDocument(editor.document)) {
        if (getAssistantMode() === AssistantMode.Background) {
          refreshDiagnostics(
            editor.document,
            tabNineDiagnostics,
            editor.visibleRanges
          );
        } else {
          // prefetch diagnostics
          getCompilerDiagnostics(
            editor.document.getText(),
            editor.document.fileName
          );
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges(async (event) => {
      if (
        getAssistantMode() === AssistantMode.Background &&
        validDocument(event.textEditor.document)
      ) {
        refreshDiagnosticsWrapper(
          event.textEditor.document,
          tabNineDiagnostics,
          event.textEditor.visibleRanges
        );
      }
    })
  );

  let currentRange: { range: vscode.Range; length: number } | null = null;
  let inPaste = false;
  pasteDisposable.dispose();
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      PASTE_COMMAND,
      async (textEditor: vscode.TextEditor) => {
        inPaste = true;
        const { start } = textEditor.selection;
        await vscode.commands.executeCommand(
          "editor.action.clipboardPasteAction"
        );
        const { end } = textEditor.selection;
        const { document } = vscode.window.activeTextEditor!;
        const isValidExt = validDocument(document);
        if (!isValidExt || getAssistantMode() === AssistantMode.Background) {
          inPaste = false;
          return;
        }
        currentRange = {
          range: new vscode.Range(start, end),
          length: document.offsetAt(end) - document.offsetAt(start),
        };
        inPaste = false;
        tabNineDiagnostics.delete(document.uri);
        setDecorators([]);
        refreshDiagnostics(document, tabNineDiagnostics, [currentRange.range]);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(ASSISTANT_IGNORE_REFRESH_COMMAND, () => {
      const { document } = vscode.window.activeTextEditor!;
      if (vscode.window.activeTextEditor && validDocument(document)) {
        if (getAssistantMode() === AssistantMode.Paste) {
          refreshDiagnostics(document, tabNineDiagnostics, [
            currentRange!.range,
          ]);
        } else {
          refreshDiagnostics(
            document,
            tabNineDiagnostics,
            vscode.window.activeTextEditor.visibleRanges
          );
        }
      }
    })
  );

  const THREDHOLD_STATE_KEY = "tabnine-assistant-threshold";
  backgroundThreshold =
    context.workspaceState.get(THREDHOLD_STATE_KEY, backgroundThreshold) ||
    backgroundThreshold;

  if (getAssistantMode() === AssistantMode.Background) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        ASSISTANT_SET_THRESHOLD_COMMAND,
        async () => {
          const prevThreshold = backgroundThreshold;
          const options: vscode.QuickPickOptions = {
            canPickMany: false,
            placeHolder: `Pick threshold (Currently: ${backgroundThreshold})`,
          };
          const items = ["Low", "Medium", "High"];
          const value = await vscode.window.showQuickPick(items, options);
          if (value && items.includes(value)) {
            backgroundThreshold = value;
            context.workspaceState.update(
              THREDHOLD_STATE_KEY,
              backgroundThreshold
            );
            setState({
              [StatePayload.STATE]: {
                state_type: StateType.threshold,
                state: JSON.stringify({
                  from: prevThreshold,
                  to: backgroundThreshold,
                }),
              },
            });
            vscode.commands.executeCommand(ASSISTANT_IGNORE_REFRESH_COMMAND);
          }
        }
      )
    );
  }

  // For AssistantMode.Paste
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (
        getAssistantMode() === AssistantMode.Paste &&
        !inPaste &&
        validDocument(event.document)
      ) {
        let firstPosition: vscode.Position | null = null;
        let delta = 0;
        event.contentChanges.forEach((cc) => {
          if (firstPosition === null) {
            firstPosition = cc.range.start;
          } else if (cc.range.start.isBefore(firstPosition)) {
            firstPosition = cc.range.start;
          }
          if (currentRange !== null) {
            if (
              cc.range.start.isAfterOrEqual(currentRange.range.start) &&
              cc.range.end.isBefore(currentRange.range.end) &&
              !(
                cc.range.start.isEqual(currentRange.range.start) &&
                cc.range.end.isEqual(currentRange.range.end)
              )
            ) {
              delta += -cc.rangeLength + (cc.text.length || 0);
            } else {
              currentRange = null;
            }
          }
        });
        if (firstPosition !== null && currentRange !== null) {
          const diagnostics = tabNineDiagnostics
            .get(event.document.uri)!
            .filter((d) => d.range.end.isBefore(firstPosition!));
          tabNineDiagnostics.set(event.document.uri, diagnostics);
          setDecorators(diagnostics);
          if (delta !== 0) {
            const newLength = currentRange.length + delta;
            const newEndPos = event.document.positionAt(
              event.document.offsetAt(currentRange.range.start) + newLength
            );
            currentRange = {
              range: new vscode.Range(currentRange.range.start, newEndPos),
              length: newLength,
            };
          }
          refreshDiagnosticsWrapper(event.document, tabNineDiagnostics, [
            currentRange.range,
          ]);
        } else {
          tabNineDiagnostics.delete(event.document.uri);
          setDecorators([]);
        }
      }
    })
  );

  // For AssistantMode.Background
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (
        getAssistantMode() === AssistantMode.Background &&
        validDocument(event.document)
      ) {
        let firstPosition: vscode.Position | null = null;
        event.contentChanges.forEach((cc) => {
          if (firstPosition === null) {
            firstPosition = cc.range.start;
          } else if (cc.range.start.isBefore(firstPosition)) {
            firstPosition = cc.range.start;
          }
        });
        if (firstPosition !== null) {
          const diagnostics = tabNineDiagnostics
            .get(event.document.uri)!
            .filter((d) => d.range.end.isBefore(firstPosition!));
          tabNineDiagnostics.set(event.document.uri, diagnostics);
          setDecorators(diagnostics);
        } else {
          tabNineDiagnostics.delete(event.document.uri);
          setDecorators([]);
        }
        refreshDiagnosticsWrapper(
          vscode.window.activeTextEditor!.document,
          tabNineDiagnostics,
          vscode.window.activeTextEditor!.visibleRanges
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      validLanguages,
      new AssistantCodeActionProvider(),
      {
        providedCodeActionKinds:
          AssistantCodeActionProvider.providedCodeActionKinds,
      }
    )
  );

  if (
    getAssistantMode() === AssistantMode.Background &&
    vscode.window.activeTextEditor &&
    validDocument(vscode.window.activeTextEditor.document)
  ) {
    refreshDiagsOrPrefetch(
      vscode.window.activeTextEditor.document,
      tabNineDiagnostics
    );
  }
}
