import { commands, ExtensionContext } from "vscode";
import { registerConfig } from "./configHandler";
import { StatePayload, StateType } from "./consts";
import { configuration, setState } from "./binary/requests";

export const CONFIG_COMMAND = "TabNine::config";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";

export function registerCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      CONFIG_COMMAND,
      openConfigWithSource(StateType.PALLETTE)
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      STATUS_BAR_COMMAND,
      openConfigWithSource(StateType.STATUS)
    )
  );
}

function openConfigWithSource(type: string) {
  return async (args) => {
    registerConfig(await configuration({ quiet: true }));
    setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
}
