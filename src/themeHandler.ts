import { ConfigurationTarget, workspace } from "vscode";


let isThemeInitialized = false;
let onThemeChangedCallback: ()=> void;
async function init () {
    const configuration = workspace.getConfiguration();
    await configuration.update("workbench.productIconTheme", "tabnine-icons", ConfigurationTarget.Workspace);
    onThemeChangedCallback();
    isThemeInitialized = true;
    
}

workspace.onDidChangeConfiguration((configuration) => {
    if (configuration.affectsConfiguration("tabnine-icons")){
        if (workspace.getConfiguration().get("workbench.productIconTheme") === "tabnine-icons") {
            onThemeChangedCallback();
            isThemeInitialized = true;
        }
        
    }
})

void init();

export function isTabnineTheme() : boolean {
    return isThemeInitialized;
}

export function onThemeChanged(callback: ()=> void): void {
    onThemeChangedCallback = callback;
    onThemeChangedCallback();
}
