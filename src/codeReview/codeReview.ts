import * as vscode from 'vscode';

let lastDocument: {
    openTime: Date,
    document: WeakRef<vscode.TextDocument>,
} | null = null;

export function registerCodeReview() {
    if (typeof WeakRef !== "undefined") {
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.uri.scheme === "git") {
                const query = JSON.parse(document.uri.query);
                if (lastDocument
                    && (query.ref === "HEAD" || query.ref === "~")
                    && lastDocument.document.deref()?.uri.path === document.uri.path
                    && (new Date().getTime() - lastDocument.openTime.getTime()) < 3000) {
                    console.log('Got here', document.uri);
                }
            }

            lastDocument = {
                openTime: new Date(),
                document: new WeakRef(document),
            };
        });
    }
}