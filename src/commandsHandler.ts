import { commands, ExtensionContext } from "vscode";
import { registerConfig } from "./configHandler";
import { StatePayload, StateType } from "./consts";
import { handleStartUpNotification } from "./notificationsHandler";
import { setProgressBar } from "./progressBar";
import { configuration, setState } from "./requests";

export const CONFIG_COMMAND = "TabNine::config";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";

export function registerCommands(context: ExtensionContext) {
  const getHandler = (type: string) => async (args) => {
    const config = await configuration({ quiet: true });
    registerConfig(context, config);
    setProgressBar(context);
    handleStartUpNotification(context);
    setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
  context.subscriptions.push(
    commands.registerCommand(CONFIG_COMMAND, getHandler(StateType.PALLETTE))
  );

  context.subscriptions.push(
    commands.registerCommand(STATUS_BAR_COMMAND, getHandler(StateType.STATUS))
  );
}

export function registerConfigurationCommand(context: ExtensionContext) {
  const handler = async () => {
    return configuration();
  };
  context.subscriptions.push(commands.registerCommand(CONFIG_COMMAND, handler));
}
