import { StatusBarItem, window, StatusBarAlignment, ExtensionContext, workspace } from "vscode";
import { TabNine, API_VERSION } from "./TabNine";
import { CONFIG_COMMAND } from "./commandsHandler";
const SPINNER = '$(sync~spin)';
const FIRST_EXECUTION_DELAY = 3000;

let statusBar: StatusBarItem;
let currentFilename = null;

export function registerStatusBar(context: ExtensionContext, tabNine: TabNine) {
    statusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    statusBar.command = CONFIG_COMMAND;
    context.subscriptions.push(statusBar);
    statusBar.tooltip ="press to open TabNine settings page";
    statusBar.show();

    workspace.onDidOpenTextDocument(({ fileName }) => {
        let firstExecutionDelay = currentFilename ? 0 : FIRST_EXECUTION_DELAY;
    
        setTimeout(() => {
          currentFilename = fileName.replace(/[.git]+$/, "");
          updateStatusBar(tabNine, currentFilename);
        }, firstExecutionDelay);
      },);
}
export function startSpinner(){
    statusBar.text = statusBar.text.replace("[ ", `[ ${SPINNER} `);
}
export function stopSpinner(){
    statusBar.text = statusBar.text.replace(` ${SPINNER}`, "");
}
function isSpinning(){
    return statusBar.text.includes(SPINNER);
}
export async function updateStatusBar(tabNine: TabNine, filename: string) {
    let {
        local_enabled,
        cloud_enabled,
        is_cpu_supported,
        is_authenticated

    } = await tabNine.request(API_VERSION, { State: { filename } });

    const animation = `${isSpinning() ? `${SPINNER} `: ""}`;

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

