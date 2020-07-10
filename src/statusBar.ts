import { StatusBarItem, window, StatusBarAlignment, ExtensionContext, workspace, commands } from "vscode";
import { TabNine, API_VERSION } from "./TabNine";
import { STATUS_BAR_COMMAND } from "./commandsHandler";
const SPINNER = '$(sync~spin)';
const GEAR = "$(gear)";
const WARNING = "$(warning)";
const FIRST_EXECUTION_DELAY = 4000;
const STATUS_BAR_TITLE = "click to open TabNine settings page";

let statusBar: StatusBarItem;
let currentFilename = null;

export function registerStatusBar(context: ExtensionContext, tabNine: TabNine) {
    statusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    statusBar.command = STATUS_BAR_COMMAND;
    context.subscriptions.push(statusBar);
    statusBar.tooltip = STATUS_BAR_TITLE;
    statusBar.text = `[ TabNine ${GEAR} ]`;
    statusBar.show();

    workspace.onDidOpenTextDocument(({ fileName }) => {
        let firstExecutionDelay = currentFilename ? 0 : FIRST_EXECUTION_DELAY;

        setTimeout(() => {
            currentFilename = fileName.replace(/[.git]+$/, "");
            updateStatusBar(tabNine, currentFilename);
        }, firstExecutionDelay);
    });
}
export function startSpinner(){
    statusBar.text = statusBar.text.replace("[ ", `[ ${SPINNER} `);
}
export function stopSpinner(){
    statusBar.text = statusBar.text.replace(` ${SPINNER}`, "");
}

export async function updateStatusBar(tabNine: TabNine, filename: string) {
    let {
        local_enabled,
        cloud_enabled,
        is_cpu_supported,
        is_authenticated

    } = await tabNine.request(API_VERSION, { State: { filename } });

    if (isInErrorState(local_enabled, is_cpu_supported, cloud_enabled, is_authenticated)){
        statusBar.text = statusBar.text.replace(`${GEAR}`, `${WARNING}`);
        statusBar.color ="pink";
        statusBar.tooltip = cloud_enabled ? "network issue" : "hardware issue";
    }
}

function isInErrorState(local_enabled: any, is_cpu_supported: any, cloud_enabled: any, is_authenticated: any) {
    return local_enabled && !is_cpu_supported || cloud_enabled && !is_authenticated;
}

