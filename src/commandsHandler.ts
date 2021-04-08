import { commands, ExtensionContext } from "vscode";
import openHub from "./registerConfig";
import {
  StatePayload,
  StateType,
  STATUS_BAR_FIRST_TIME_CLICKED,
} from "./consts";
import { configuration } from "./binary/requests/requests";
import setState from "./binary/requests/setState";
import { Capability, isCapabilityEnabled } from "./capabilities";

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
    commands.registerCommand(STATUS_BAR_COMMAND, handleStatusBar(context))
  );
}

function handleStatusBar(context: ExtensionContext) {
  const openConfigWithStatusSource = openConfigWithSource(StateType.STATUS);

  return async (args: string[] | null = null): Promise<void> => {
    await openConfigWithStatusSource(args);

    if (
      isCapabilityEnabled(Capability.SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED)
    ) {
      await context.globalState.update(STATUS_BAR_FIRST_TIME_CLICKED, true);
    }
  };
}

export function openConfigWithSource(type: StateType) {
  return async (args: string[] | null = null): Promise<void> => {
    openHub(await configuration({ quiet: true, source: type }));
    void setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
}
