import { StatusBarItem, window, StatusBarAlignment, ExtensionContext } from "vscode";
import { TabNine } from "./TabNine";
let statusBar: StatusBarItem;

export function registerStatusBar(configCommand: string, context: ExtensionContext) {
    statusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    statusBar.command = configCommand;
    context.subscriptions.push(statusBar);
}
export function startSpinner(){
    statusBar.text = statusBar.text.replace("[ ", "[ $(sync~spin) ");
}
export function stopSpinner(){
    statusBar.text.replace(" $(sync~spin)", "");
}
export async function updateStatusBar(tabNine: TabNine, filename: string) {
    let {
        local_enabled,
        cloud_enabled,
        service_level,
        language,
        is_lsp_enabled,
    } = await tabNine.request("1.7.0", { State: { filename } });
    
    const deep = getDeepDisplay(local_enabled, cloud_enabled);

    statusBar.text =
        `[ TabNine - ${service_level} | ${language} LSP ${is_lsp_enabled ? "$(check)" : "$(issues)"} | ${deep} ]`;

    statusBar.tooltip =
        "press to open TabNine settings page";

    statusBar.show();
}

function getDeepDisplay(local_enabled: any, cloud_enabled: any) {
    let deep = "None";
    if (local_enabled) {
        deep = "Local";
    }
    if (cloud_enabled) {
        deep = "Cloud";
    }
    if (cloud_enabled && local_enabled) {
        deep = "Cloud & Local";
    }
    return deep;
}
