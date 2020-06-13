import { StatusBarItem, window, StatusBarAlignment, ExtensionContext } from "vscode";
import { TabNine } from "./TabNine";
const spinner = '$(sync~spin)';
let statusBar: StatusBarItem;

export function registerStatusBar(configCommand: string, context: ExtensionContext) {
    statusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    statusBar.command = configCommand;
    context.subscriptions.push(statusBar);
    statusBar.tooltip ="press to open TabNine settings page";
    statusBar.show();
}
export function startSpinner(){
    statusBar.text = statusBar.text.replace("[ ", `[ ${spinner} `);
}
export function stopSpinner(){
    statusBar.text = statusBar.text.replace(` ${spinner}`, "");
}
function isSpinning(){
    return statusBar.text.includes(spinner);
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
    const animation = `${isSpinning() ? `${spinner} `: ""}`;

    statusBar.text =
        `[ ${animation}TabNine - ${service_level} | ${language} LSP ${is_lsp_enabled ? "$(check)" : "$(issues)"} | ${deep} ]`;
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
