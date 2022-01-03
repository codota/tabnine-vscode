import * as vscode from "vscode";
import { Mutex } from "await-semaphore";
import CancellationToken from "./CancellationToken";
import {
  getAssistantMode,
  setAssistantMode,
  AssistantMode,
} from "./AssistantMode";

import { AssistantDiagnostic } from "./AssistantDiagnostic";
import { debounce, getAPIKey } from "./utils";

import setState from "../binary/requests/setState";
import getValidator, { DocumentValidator } from "./DocumentValidator";
import getAssistantDiagnostics from "./requests/getAssistantDiagnostics";
import getCompilerDiagnostics from "./requests/getCompilerDiagnostics";
import AssistantCodeActionProvider from "./AssistantCodeActionProvider";
import getValidLanguages from "./requests/getValidLanguages";
import TabNineDiagnostic from "./TabNineDiagnostic";
import {
  ASSISTANT_IGNORE_REFRESH_COMMAND,
  ASSISTANT_MODE_TOGGLE_COMMAND,
  EDIT_DISTANCE,
  PASTE_COMMAND,
  PASTE_THRESHOLD,
  TABNINE_DIAGNOSTIC_CODE,
} from "./globals";
import {
  initAssistantThreshold,
  getBackgroundThreshold,
} from "./handleAssistantThreshold";

const decorationType = vscode.window.createTextEditorDecorationType({
  border: "#3794FF 2px",
  borderStyle: "none none solid none",
});

const changesTrackMap = new Map<vscode.Uri, vscode.Position>();

export function setDecorators(
  diagnostics: vscode.Diagnostic[] | undefined
): void {
  const editor = vscode.window.activeTextEditor;
  const decorationsArray: vscode.DecorationOptions[] =
    diagnostics?.map(({ range }) => ({ range })) || [];
  if (editor) {
    editor.setDecorations(decorationType, decorationsArray);
  }
}

function setStatusBarMessage(message?: string, timeout = 30000): void {
  if (!message?.length) {
    return;
  }
  vscode.window.setStatusBarMessage(`${message}`, timeout);
}

const mutex: Mutex = new Mutex();
const cancellationToken = new CancellationToken();

function getRelevantRange(
  document: vscode.TextDocument,
  visibleRanges: vscode.Range[]
): vscode.Range | undefined {
  const firstEditingPosition = changesTrackMap.get(document.uri);
  const visibleRange = visibleRanges.reduce((accumulator, currentValue) =>
    accumulator.union(currentValue)
  );

  return (
    firstEditingPosition &&
    visibleRange.intersection(
      new vscode.Range(firstEditingPosition, visibleRange.end)
    )
  );
}

async function refreshDiagnostics(
  document: vscode.TextDocument,
  diagnosticsCollection: vscode.DiagnosticCollection,
  visibleRanges: vscode.Range[]
): Promise<void> {
  cancellationToken.cancel();
  const lock = await mutex.acquire();
  cancellationToken.reset();
  cancellationToken.registerCallback(setStatusBarMessage);
  try {
    let foundDiagnostics = 0;
    const relevantRange = getRelevantRange(document, visibleRanges);

    if (!relevantRange) {
      return;
    }

    const start = document.offsetAt(relevantRange.start);
    const end = document.offsetAt(relevantRange.end);
    const threshold =
      getAssistantMode() === AssistantMode.Background
        ? getBackgroundThreshold()
        : PASTE_THRESHOLD;
    const code = document.getText();
    const apiKey = await getAPIKey();
    if (cancellationToken.isCancelled()) {
      return;
    }
    const assistantDiagnostics:
      | AssistantDiagnostic[]
      | undefined = await getAssistantDiagnostics(
      code,
      document.fileName,
      { start, end },
      threshold,
      EDIT_DISTANCE,
      apiKey,
      cancellationToken
    );
    if (cancellationToken.isCancelled()) {
      return;
    }
    const newDiagnostics: TabNineDiagnostic[] = [];
    assistantDiagnostics?.forEach((assistantDiagnostic) => {
      const choices = assistantDiagnostic.completionList.filter(
        (completion) => completion.value !== assistantDiagnostic.reference
      );
      const choicesString = choices.map(
        (completion) =>
          `${completion.message} '${completion.value}'\t${completion.score}%`
      );
      if (choices.length > 0) {
        const prevReferencesLocationsInRange = assistantDiagnostic.references.filter(
          (r) => r.start < assistantDiagnostic.range.start
        );
        const prevDiagnosticsForReferenceInRange = newDiagnostics.filter(
          (diag) => prevReferencesLocationsInRange.includes(diag.assistantRange)
        );

        // If we are in paste mode and one of the previous reference was ok (no suggestions), don't suggest things on this reference.
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
            `${choicesString.join("\n")}`,
            choices,
            assistantDiagnostic.reference,
            vscodeReferencesRange,
            assistantDiagnostic.range,
            assistantDiagnostic.responseId,
            threshold,
            vscode.DiagnosticSeverity.Information
          );
          diagnostic.code = TABNINE_DIAGNOSTIC_CODE;
          newDiagnostics.push(diagnostic);
          foundDiagnostics += 1;
        }
      }
    });
    if (newDiagnostics.length > 0) {
      void setState({
        ValidatorState: {
          num_of_diagnostics: newDiagnostics.length,
          num_of_locations: assistantDiagnostics?.length || 0,
        },
      });
    }
    if (
      diagnosticsCollection.get(document.uri)?.length !== newDiagnostics.length
    ) {
      setDecorators(newDiagnostics);
      diagnosticsCollection.set(document.uri, newDiagnostics);
    }
    const message = foundDiagnostics ? `${foundDiagnostics}` : "";
    console.log(message);
    setStatusBarMessage("$(pass)");
  } catch (e: unknown) {
    setStatusBarMessage();
    console.error(`tabnine assistant: error: `, e);
  } finally {
    lock();
  }
}
const debouncedRefreshDiagnostics = debounce(refreshDiagnostics);

function refreshDiagnosticsOrPrefetch(
  document: vscode.TextDocument,
  tabNineDiagnostics: vscode.DiagnosticCollection
) {
  if (getAssistantMode() === AssistantMode.Background) {
    if (vscode.window.activeTextEditor) {
      void refreshDiagnostics(document, tabNineDiagnostics, [
        ...vscode.window.activeTextEditor.visibleRanges,
      ]);
    }
  } else {
    // prefetch diagnostics (getAssistantMode() == Mode.Paste)
    void getCompilerDiagnostics(document.getText(), document.fileName);
  }
}
let currentRange: { range: vscode.Range; length: number } | null = null;
let inPaste = false;

export default async function registerAssistant(
  context: vscode.ExtensionContext,
  pasteDisposable: vscode.Disposable
): Promise<void> {
  const tabnineDiagnostics = vscode.languages.createDiagnosticCollection(
    "tabnine"
  );
  context.subscriptions.push(tabnineDiagnostics);
  const documentValidator = await getValidator();

  initAssistantThreshold(context);

  registerRefreshCommand(context, documentValidator, tabnineDiagnostics);

  registerAssistantModeToggle(tabnineDiagnostics, documentValidator);

  // handleActiveEditorChanged(context, documentValidator, tabnineDiagnostics);

  handleVisibleRangeChange(context, documentValidator, tabnineDiagnostics);

  pasteDisposable.dispose();
  registerPasteCommand(context, documentValidator, tabnineDiagnostics);

  // For AssistantMode.Paste
  handlePasteChange(context, tabnineDiagnostics, documentValidator);

  // For AssistantMode.Background
  handleTextChange(context, tabnineDiagnostics, documentValidator);

  void handleCodeAction(context);

  // if (
  //   getAssistantMode() === AssistantMode.Background &&
  //   vscode.window.activeTextEditor &&
  //   documentValidator.isValid(vscode.window.activeTextEditor.document)
  // ) {
  //   refreshDiagnosticsOrPrefetch(
  //     vscode.window.activeTextEditor.document,
  //     tabnineDiagnostics
  //   );
  // }
}

function registerRefreshCommand(
  context: vscode.ExtensionContext,
  documentValidator: DocumentValidator,
  tabnineDiagnostics: vscode.DiagnosticCollection
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(ASSISTANT_IGNORE_REFRESH_COMMAND, () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const { document, visibleRanges } = editor;
        if (documentValidator.isValid(document)) {
          if (getAssistantMode() === AssistantMode.Paste) {
            if (currentRange) {
              void refreshDiagnostics(document, tabnineDiagnostics, [
                currentRange?.range,
              ]);
            }
          } else {
            void refreshDiagnostics(document, tabnineDiagnostics, [
              ...visibleRanges,
            ]);
          }
        }
      }
    })
  );
}

function registerAssistantModeToggle(
  tabNineDiagnostics: vscode.DiagnosticCollection,
  validator: DocumentValidator
) {
  vscode.commands.registerCommand(ASSISTANT_MODE_TOGGLE_COMMAND, () => {
    cancellationToken.cancel();
    if (vscode.window.activeTextEditor) {
      tabNineDiagnostics.delete(vscode.window.activeTextEditor.document.uri);
    }
    setDecorators([]);
    const newMode =
      getAssistantMode() === AssistantMode.Background
        ? AssistantMode.Paste
        : AssistantMode.Background;
    setAssistantMode(newMode);

    if (getAssistantMode() === AssistantMode.Paste) {
      void vscode.window.showInformationMessage("tabnine assistant paste mode");
      console.log("paste validation mode");
    } else {
      void vscode.window.showInformationMessage(
        "tabnine assistant background mode"
      );
      console.log("background validation mode");
    }

    if (
      vscode.window.activeTextEditor &&
      validator.isValid(vscode.window.activeTextEditor.document)
    ) {
      refreshDiagnosticsOrPrefetch(
        vscode.window.activeTextEditor.document,
        tabNineDiagnostics
      );
    }
  });
}

// function handleActiveEditorChanged(
//   context: vscode.ExtensionContext,
//   validator: DocumentValidator,
//   tabNineDiagnostics: vscode.DiagnosticCollection
// ) {
//   context.subscriptions.push(
//     vscode.window.onDidChangeActiveTextEditor((editor) => {
//       if (editor && validator.isValid(editor.document)) {
//         if (getAssistantMode() === AssistantMode.Background) {
//           void refreshDiagnostics(
//             editor.document,
//             tabNineDiagnostics,
//             editor.visibleRanges
//           );
//         } else {
//           // prefetch diagnostics
//           void getCompilerDiagnostics(
//             editor.document.getText(),
//             editor.document.fileName
//           );
//         }
//       }
//     })
//   );
// }

function handleVisibleRangeChange(
  context: vscode.ExtensionContext,
  validator: DocumentValidator,
  tabNineDiagnostics: vscode.DiagnosticCollection
) {
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
      if (
        getAssistantMode() === AssistantMode.Background &&
        validator.isValid(event.textEditor.document)
      ) {
        debouncedRefreshDiagnostics(
          event.textEditor.document,
          tabNineDiagnostics,
          event.textEditor.visibleRanges
        );
      }
    })
  );
}

function registerPasteCommand(
  context: vscode.ExtensionContext,
  validator: DocumentValidator,
  tabNineDiagnostics: vscode.DiagnosticCollection
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      PASTE_COMMAND,
      async (textEditor: vscode.TextEditor) => {
        inPaste = true;
        const { start } = textEditor.selection;
        await vscode.commands.executeCommand(
          "editor.action.clipboardPasteAction"
        );
        const { end } = textEditor.selection;
        if (vscode.window.activeTextEditor) {
          const { document } = vscode.window.activeTextEditor;
          const isValidExt = validator.isValid(document);
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
          void refreshDiagnostics(document, tabNineDiagnostics, [
            currentRange.range,
          ]);
        }
      }
    )
  );
}

function handlePasteChange(
  context: vscode.ExtensionContext,
  assistantDiagnostics: vscode.DiagnosticCollection,
  validator: DocumentValidator
) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (
        getAssistantMode() === AssistantMode.Paste &&
        !inPaste &&
        validator.isValid(event.document)
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
          const diagnostics = assistantDiagnostics
            .get(event.document.uri)
            ?.filter((d) =>
              d.range.end.isBefore(firstPosition as vscode.Position)
            );
          assistantDiagnostics.set(event.document.uri, diagnostics);
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
          debouncedRefreshDiagnostics(event.document, assistantDiagnostics, [
            currentRange.range,
          ]);
        } else {
          assistantDiagnostics.delete(event.document.uri);
          setDecorators([]);
        }
      }
    })
  );
}

function handleTextChange(
  context: vscode.ExtensionContext,
  assistantDiagnostics: vscode.DiagnosticCollection,
  validator: DocumentValidator
) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (
        getAssistantMode() === AssistantMode.Background &&
        validator.isValid(event.document) &&
        event.contentChanges.length
      ) {
        const firstChangeStartPosition = event.contentChanges
          .map((change) => change.range.start)
          .reduce((first: vscode.Position | null, current) => {
            if (first === null) {
              return current;
            }
            if (current.isBefore(first)) {
              return current;
            }
            return first;
          }, null);

        if (firstChangeStartPosition !== null) {
          const diagnostics = assistantDiagnostics
            .get(event.document.uri)
            ?.filter((d) => d.range.end.isBefore(firstChangeStartPosition));
          assistantDiagnostics.set(event.document.uri, diagnostics);
          if (
            assistantDiagnostics.get(event.document.uri)?.length !==
            diagnostics?.length
          ) {
            setDecorators(diagnostics);
          }
          if (!changesTrackMap.has(event.document.uri)) {
            changesTrackMap.set(event.document.uri, firstChangeStartPosition);
          }
        } else {
          assistantDiagnostics.delete(event.document.uri);
          setDecorators([]);
        }
        if (vscode.window.activeTextEditor) {
          debouncedRefreshDiagnostics(
            vscode.window.activeTextEditor.document,
            assistantDiagnostics,
            vscode.window.activeTextEditor.visibleRanges
          );
        }
      }
    })
  );
}

async function handleCodeAction(context: vscode.ExtensionContext) {
  const validLanguages = await getValidLanguages();
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
}
