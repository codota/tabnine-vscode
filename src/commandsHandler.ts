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
        }, 5000);
        registerConfig(tabNine, context, config);
        setProgressBar(tabNine, context);
        handleStartUpNotification(tabNine, context);
        tabNine.setState({ [StatePayload.state]: {state_type: args?.join("-") || type}})
    };
    context.subscriptions.push(commands.registerCommand(CONFIG_COMMAND, getHandler(StateType.pallette)));

    context.subscriptions.push(commands.registerCommand(STATUS_BAR_COMMAND, getHandler(StateType.status)));
}

export function registerConfigurationCommand(tabNine: TabNine, context: ExtensionContext) {
    const handler = async () => {
        const config = await tabNine.request(API_VERSION, {
            "Configuration": { }
        }, 5000);
    };
    context.subscriptions.push(commands.registerCommand(CONFIG_COMMAND, handler));
}