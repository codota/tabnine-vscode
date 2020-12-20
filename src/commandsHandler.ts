import { commands, ExtensionContext } from "vscode";
import registerConfig from "./registerConfig";
import { StatePayload, StateType } from "./consts";
import { configuration } from "./binary/requests/requests";
import setState from "./binary/requests/setState";

export const CONFIG_COMMAND = "TabNine::config";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";

export function registerCommands(context: ExtensionContext): void {
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

export function openConfigWithSource(type: string) {
  return async (args: string[] | null = null): Promise<void> => {
    registerConfig(await configuration({ quiet: true }));
    void setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
}
