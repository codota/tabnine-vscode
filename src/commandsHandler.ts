import { API_VERSION, TabNine, StatePayload, StateType } from "./TabNine";
import { setProgressBar } from "./progressBar";
import { handleStartUpNotification } from "./notificationsHandler";
import { ExtensionContext, commands } from "vscode";
import { registerConfig } from "./configHandler";
export const CONFIG_COMMAND = 'TabNine::config';
export const STATUS_BAR_COMMAND = 'TabNine.statusBar';

export function registerCommands(tabNine: TabNine, context: ExtensionContext) {
    const getHandler = (type: string) => async (args) => {
        const config = await tabNine.request(API_VERSION, {
            "Configuration": { quiet: true }
        });
        registerConfig(context, tabNine, config);
        setProgressBar(tabNine);
        handleStartUpNotification(tabNine);
        tabNine.setState({ [StatePayload.state]: {state_type: args || type}})
    };
    context.subscriptions.push(commands.registerCommand(CONFIG_COMMAND, getHandler(StateType.pallette)));

    context.subscriptions.push(commands.registerCommand(STATUS_BAR_COMMAND, getHandler(StateType.status)));
}