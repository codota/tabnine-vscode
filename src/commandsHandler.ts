import { commands, ExtensionContext, Uri, env } from "vscode";
import openHub, { restartHub } from "./hub/openHub";
import {
  StatePayload,
  StateType,
  STATUS_BAR_FIRST_TIME_CLICKED,
} from "./globals/consts";
import {
  configuration,
  onTabnineProcessRestart,
} from "./binary/requests/requests";
import setState from "./binary/requests/setState";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import handleSaveSnippet, {
  enableSaveSnippetContext,
} from "./saveSnippetHandler";

export const CONFIG_COMMAND = "TabNine::config";
export const STATUS_BAR_COMMAND = "TabNine.statusBar";
export const SAVE_SNIPPET_COMMAND = "Tabnine.saveSnippet";

export async function registerCommands(
  context: ExtensionContext
): Promise<void> {
  context.subscriptions.push(
    commands.registerCommand(
      CONFIG_COMMAND,
      openConfigWithSource(StateType.PALLETTE)
    )
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

async function getHubUri(type: StateType, path?: string): Promise<Uri | null> {
  const config = await configuration({ quiet: true, source: type });
  if (config && config.message) {
    const uri = Uri.parse(`${config.message}${path || ""}`);
    return env.asExternalUri(uri);
  }
  return null;
}
export function openConfigWithSource(type: StateType, path?: string) {
  return async (args: string[] | null = null): Promise<void> => {
    const hubUri = await getHubUri(type, path);
    if (hubUri) {
      await openHub(hubUri);
      onTabnineProcessRestart(() => {
        void getHubUri(type, path).then(
          (newHubUri) => newHubUri && restartHub(newHubUri)
        );
      });
    }

    void setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
}
