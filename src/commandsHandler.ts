import { commands, ExtensionContext, window, workspace } from "vscode";
import { StateType, STATUS_BAR_FIRST_TIME_CLICKED } from "./globals/consts";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import openHub, { openHubExternal } from "./hub/openHub";
import {
  isCompletionsEnabled,
  setCompletionsEnabled,
} from "./state/completionsState";

const CONFIG_COMMAND = "TabNine::config";
const CONFIG_EXTERNAL_COMMAND = "TabNine::configExternal";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";

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
}

const SETTINGS_BUTTON = "Open Hub";
const RESUME_TABNINE = "Resume Tabnine";

function handleStatusBar(context: ExtensionContext) {
  return (args: string[] | null = null) => {
    const snoozeDuration = workspace
      .getConfiguration("tabnine")
      .get<number>("snoozeDuration", 1);

    const snoozeTabnine = `Snooze Tabnine (${snoozeDuration}h)`;

    const currentAction = isCompletionsEnabled()
      ? snoozeTabnine
      : RESUME_TABNINE;

    void window
      .showInformationMessage("Tabnine options", SETTINGS_BUTTON, currentAction)
      .then((selection) => {
        switch (selection) {
          case SETTINGS_BUTTON:
            void openHubHandler(context, args);
            break;
          case snoozeTabnine:
            setCompletionsEnabled(false);
            break;
          case RESUME_TABNINE:
            setCompletionsEnabled(true);
            break;
          default:
            console.warn("Unexpected selection");
            break;
        }
      });
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
