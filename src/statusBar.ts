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
        is_cpu_supported,
        is_authenticated

    } = await tabNine.request("1.7.0", { State: { filename } });

    const animation = `${isSpinning() ? `${spinner} `: ""}`;

    let icon = "$(gear)";

    if (isInErrorState(local_enabled, is_cpu_supported, cloud_enabled, is_authenticated)){
        icon = "$(warning)";
        statusBar.color ="red";
    }
    else {
        statusBar.color = undefined;
    }

    statusBar.text =
        `[ ${animation}TabNine ${icon} ]`;
}

function isInErrorState(local_enabled: any, is_cpu_supported: any, cloud_enabled: any, is_authenticated: any) {
    return local_enabled && !is_cpu_supported || cloud_enabled && !is_authenticated;
}

