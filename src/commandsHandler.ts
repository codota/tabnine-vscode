import { commands, ExtensionContext } from "vscode";
import SignInUsingCustomTokenCommand from "./authentication/loginWithCustomTokenCommand";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import {
  StateType,
  STATUS_BAR_FIRST_TIME_CLICKED,
  CONFIG_COMMAND,
} from "./globals/consts";
import openHub, { openHubExternal } from "./hub/openHub";
import { showStatusBarNotificationOptions } from "./statusBar/statusBarNotificationOptions";

const CONFIG_EXTERNAL_COMMAND = "TabNine::configExternal";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";
export const SIGN_IN_AUTH_TOKEN_COMMAND = "tabnine.signInUsingAuthToken";

export function registerCommands(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand(CONFIG_COMMAND, openHub(StateType.PALLETTE))
  );
  context.subscriptions.push(
    commands.registerCommand(
      CONFIG_EXTERNAL_COMMAND,
      openHubExternal(StateType.PALLETTE)
    )
  );
  context.subscriptions.push(
    commands.registerCommand(STATUS_BAR_COMMAND, handleStatusBar(context))
  );
  context.subscriptions.push(
    commands.registerCommand(
      SIGN_IN_AUTH_TOKEN_COMMAND,
      SignInUsingCustomTokenCommand
    )
  );
}

function handleStatusBar(context: ExtensionContext) {
  return (args: string[] | null = null) => {
    showStatusBarNotificationOptions(
      "Open Hub",
      () => void openHubHandler(context, args)
    );
  };
}

async function openHubHandler(
  context: ExtensionContext,
  args: string[] | null = null
) {
  await openHub(StateType.STATUS)(args);
  if (isCapabilityEnabled(Capability.SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED)) {
    await context.globalState.update(STATUS_BAR_FIRST_TIME_CLICKED, true);
  }
}
