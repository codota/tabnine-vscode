
import * as vscode from 'vscode';
import { TabNineExtensionContext } from './TabNineExtensionContext';

const EXTENSION_SUBSTRING = "tabnine-vscode"

export function getContext(): TabNineExtensionContext {
    const extension = vscode.extensions.all.find(x => x.id.includes(EXTENSION_SUBSTRING));
    const configuration = vscode.workspace.getConfiguration();
    const isJavaScriptAutoImports = configuration.get<boolean>("javascript.suggest.autoImports");
    const isTypeScriptAutoImports = configuration.get<boolean>("typescript.suggest.autoImports");
    const autoImportConfig = 'tabnine.experimentalAutoImports';
    let isTabNineAutoImportEnabled = configuration.get<boolean | null | number>(autoImportConfig);

    if (isTabNineAutoImportEnabled === null) {
        const experiment = Number(Math.random() * 100 < 5);
        configuration.update(autoImportConfig, experiment, true);
        isTabNineAutoImportEnabled = experiment;
    }
    return {
        get extensionPath(): string {
            return extension.extensionPath;
        },

        get version(): string {
            return extension.packageJSON.version;
        },
        get id (){
            return extension.id;
        },

        get name(): string {
            return `${EXTENSION_SUBSTRING}-${this.version}`
        },
        get vscodeVersion(): string {
            return vscode.version;
        },
        get isTabNineAutoImportEnabled(): boolean | number {
            return isTabNineAutoImportEnabled;
        },
        get isJavaScriptAutoImports(): boolean {
            return isJavaScriptAutoImports;
        },
        get isTypeScriptAutoImports(): boolean {
            return isTypeScriptAutoImports;
        }
    }
}
