// eslint-disable-next-line max-classes-per-file
import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  Diagnostic,
  DiagnosticSeverity,
  Event,
  EventEmitter,
  ExtensionContext,
  languages,
  Location,
  TextDocument,
  Uri,
} from "vscode";
import { fireEvent } from "../../binary/requests/requests";
import { getFuctionsSymbols } from "./getFuctionsSymbols";
import { Action, COMANDS } from "./commands";
import tabnineExtensionProperties from "../../globals/tabnineExtensionProperties";
import { languagesFilter } from "./const";

const MAX_LINES = 2500;

export default function registerChatCodeLens(context: ExtensionContext) {
  if (!tabnineExtensionProperties.codeLensEnabled) {
    return;
  }
  context.subscriptions.push(
    languages.registerCodeLensProvider(
      languagesFilter,
      new ChatCodeLensProvider()
    )
  );
}

class ChatCodeLensProvider implements CodeLensProvider {
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
      lenses.push(...toIntentLens(location, diagnostic), toAskLens(location));
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
  return (
    COMANDS.filter(
      ({ text, lensOrder }) =>
        lensOrder && filterRelevantActions(text, location, diagnostics)
    )
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .sort((a, b) => a.lensOrder! - b.lensOrder!)
      .map(
        ({ text, intent }, index) =>
          new CodeLens(location.range, {
            title: `${index === 0 ? "tabnine: " : ""}${text}`,
            tooltip: `tabnine ${text}`,
            command: "tabnine.chat.commands.any",
            arguments: [location.range, intent],
          })
      )
  );
}
function filterRelevantActions(
  text: Action,
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
