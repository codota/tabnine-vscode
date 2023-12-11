// eslint-disable-next-line max-classes-per-file
import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  commands,
  Diagnostic,
  DiagnosticSeverity,
  DocumentSymbol,
  Event,
  EventEmitter,
  languages,
  Location,
  SymbolInformation,
  SymbolKind,
  TextDocument,
  Uri,
} from "vscode";
import { fireEvent } from "../../../binary/requests/requests";

const CODE_LENS_ACTIONS = [
  ["test", "generate-test-for-code"],
  ["fix", "fix-code"],
  ["explain", "explain-code"],
  ["document", "document-code"],
];

const MAX_LINES = 2500;

export class ChatCodeLensProvider implements CodeLensProvider {
  private visitedFiles: Set<Uri> = new Set();

  private didChangeCodeLenses = new EventEmitter<void>();

  get onDidChangeCodeLenses(): Event<void> {
    return this.didChangeCodeLenses.event;
  }

  // eslint-disable-next-line class-methods-use-this
  public async provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): Promise<CodeLens[] | undefined> {
    if (document.lineCount > MAX_LINES) {
      return [];
    }

    const documnetSymbols = await getFuctionsSymbols(document);

    if (!documnetSymbols?.length) {
      return [];
    }
    if (token.isCancellationRequested) {
      return [];
    }

    const diagnostic = await getDiagnosticsAsync(document);

    if (token.isCancellationRequested) {
      return [];
    }

    const lenses: CodeLens[] = [];

    documnetSymbols.forEach(({ location }) => {
      lenses.push(...toIntentLens(location), toAskLens(location));
    });

    if (!this.visitedFiles.has(document.uri)) {
      this.visitedFiles.add(document.uri);
      void fireEvent({
        name: "chat-lens-label-rendered",
        language: document.languageId,
        labelsCount: lenses.length,
      });
    }

    return lenses;
  }
}

async function getDiagnosticsAsync(
  document: TextDocument
): Promise<Diagnostic[]> {
  return new Promise<Diagnostic[]>((resolve) => {
    setTimeout(() => {
      resolve(languages.getDiagnostics(document.uri));
    }, 100);
  });
}

function toAskLens(location: Location): CodeLens {
  return new CodeLens(location.range, {
    title: `ask`,
    tooltip: `tabnine ask`,
    command: "tabnine.chat.commands.ask",
    arguments: [location.range],
  });
}

function toIntentLens(
  location: Location,
  diagnostics: Diagnostic[]
): CodeLens[] {
  return CODE_LENS_ACTIONS.filter(([text]) =>
    filterRelevantActions(text, location, diagnostics)
  ).map(
    ([text, action], index) =>
      new CodeLens(location.range, {
        title: `${index === 0 ? "tabnine: " : ""}${text}`,
        tooltip: `tabnine ${text}`,
        command: "tabnine.chat.commands.any",
        arguments: [location.range, action],
      })
  );
}
function filterRelevantActions(
  text: Intents,
  location: Location,
  diagnostics: Diagnostic[]
): boolean {
  const hasFix = diagnostics.some(
    ({ severity, range }) =>
      severity === DiagnosticSeverity.Error && location.range.contains(range)
  );
  if (text === "fix") {
    return hasFix;
  }
  return true;
}
