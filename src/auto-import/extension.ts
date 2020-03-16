import * as vscode from 'vscode';

import { ErrorHelper } from './helpers/error-helper';
import { AutoImport } from './auto-import';

export function activate(context: vscode.ExtensionContext) {

    try {

        if (context.workspaceState.get('auto-import-settings') === undefined) {
            context.workspaceState.update('auto-import-settings', {});
        }

        let extension = new AutoImport(context);

        let start = extension.start();

        if (!start) {
            return;
        }

        extension.attachCommands();

        extension.attachFileWatcher();

        extension.scanIfRequired();
        

    } catch (error) {
        ErrorHelper.handle(error);
    }

}

export function deactivate() {

}