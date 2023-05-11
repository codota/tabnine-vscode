import { CommentThread, Uri } from "vscode";

export default class DocumentThreads {
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
