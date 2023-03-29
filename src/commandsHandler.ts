import { commands, ExtensionContext } from "vscode";
import { StateType, STATUS_BAR_FIRST_TIME_CLICKED } from "./globals/consts";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import handleSaveSnippet, {
  enableSaveSnippetContext,
} from "./saveSnippetHandler";
import openHub from "./hub/openHub";

export const CONFIG_COMMAND = "TabNine::config";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";
export const SAVE_SNIPPET_COMMAND = "Tabnine.saveSnippet";

export async function registerCommands(
  context: ExtensionContext
): Promise<void> {
  context.subscriptions.push(
    commands.registerCommand(CONFIG_COMMAND, openHub(StateType.PALLETTE))
  );
  context.subscriptions.push(
    commands.registerCommand(STATUS_BAR_COMMAND, handleStatusBar(context))
  );

  if (isCapabilityEnabled(Capability.SAVE_SNIPPETS)) {
    await enableSaveSnippetContext();
    context.subscriptions.push(
      commands.registerCommand(SAVE_SNIPPET_COMMAND, handleSaveSnippet)
    );
  }
}

function handleStatusBar(context: ExtensionContext) {
  const openHubWithStatus = openHub(StateType.STATUS);

  return async (args: string[] | null = null): Promise<void> => {
    await openHubWithStatus(args);

    if (
      isCapabilityEnabled(Capability.SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED)
    ) {
      await context.globalState.update(STATUS_BAR_FIRST_TIME_CLICKED, true);
    }
  };
}
