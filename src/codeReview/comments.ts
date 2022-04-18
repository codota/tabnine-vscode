import {
  CommentController,
  CommentMode,
  CommentThread,
  CommentThreadCollapsibleState,
  TextDocument,
  Uri,
} from "vscode";
import * as path from "path";
import * as api from './api';

export async function addComments(
  controller: CommentController,
  document: TextDocument,
  oldDocument: TextDocument
): Promise<DocumentThreads | null> {
  let extensions = await supportedExtensions();
  if (!extensions.includes(path.extname(document.uri.path))) {
    return null;
  }

  let text = document.getText();

  const response = await api.querySuggestions({
    filename: path.basename(document.uri.path),
    buffer: text,
    ranges: [{ start: 0, end: text.length }],
    threshold: 'review'
  });

  let iconUri = Uri.file(path.resolve(__dirname, "..", "small_logo.png"));
  let author = { name: "Tabnine", iconPath: iconUri };

  let threads: CommentThread[] = [];
  response.focus.forEach((focus: api.Suggestions) => {
    let suggestion: api.Suggestion | undefined = focus.suggestions.find(suggestion => suggestion.classification.type === 'other');
    if (!suggestion) {
      return;
    }

    let line = document.lineAt(document.positionAt(focus.start));
    let thread = controller.createCommentThread(
      document.uri,
      line.range,
      [
        {
          author,
          mode: CommentMode.Preview,
          body: suggestion.value,
        },
      ]
    );

    thread.canReply = false;
    thread.collapsibleState = CommentThreadCollapsibleState.Expanded;
    thread.label = suggestion.classification.description;

    threads.push(thread);
  });

  return new DocumentThreads(document.uri, threads);
}

export class DocumentThreads {
  readonly uri: Uri;
  private readonly threads: CommentThread[];

  constructor(uri: Uri, threads: CommentThread[]) {
    this.uri = uri;
    this.threads = threads;
  }

  dispose(): void {
    this.threads.forEach((thread) => thread.dispose());
  }
}

let cachedSupportedExtensions: string[] | null = null;
async function supportedExtensions(): Promise<string[]> {
  if (!cachedSupportedExtensions) {
    cachedSupportedExtensions = (await api.supportedExtensions()).extensions;
  }

  return cachedSupportedExtensions;
}

setInterval(() => { cachedSupportedExtensions = null; }, 1000 * 60 * 10); // reset extension cache every 10 minutes