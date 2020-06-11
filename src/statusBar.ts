import { StatusBarItem, window, StatusBarAlignment, ExtensionContext,ThemeColor } from "vscode";
import { TabNine } from "./TabNine";
let tabNineStatusBar: StatusBarItem;

export function registerStatusBar(configCommand: string, context: ExtensionContext) {
    tabNineStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    tabNineStatusBar.command = configCommand;
    context.subscriptions.push(tabNineStatusBar);
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

    tabNineStatusBar.text =
        `[ TabNine - ${service_level} | ${language} LSP ${is_lsp_enabled ? "$(check)" : "$(issues)"} | ${deep} ]`;

    tabNineStatusBar.tooltip =
        "press to open tabnine settings page";

    tabNineStatusBar.show();
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
