import { EOL } from "os";
import { commands, ExtensionContext, window } from "vscode";
import { CONFIG_COMMAND } from "./commandsHandler";
import { StatePayload, StateType } from "./consts";
import { getState, setState } from "./requests";
import { once } from "./utils";
const memoize = require("lodash.memoize");

const CLOUD_CAPABLE_NOT_ENABLED =
  "You had registered to TabNine Professional but didn't enable the Deep Cloud";
const ENABLED_CLOUD_ACTION = "Enable Deep Cloud";
const ENABLED_CLOUD_NOTIFICATION_KEY = "tabnine.hide.enable-cloud.notification";

export const handleInfoMessage = memoize(
  (message: string, onClick = (action: string) => {}, ...args: string[]) => {
    setState({
      [StatePayload.MESSAGE]: { message_type: StateType.INFO, message },
    });
    return window.showInformationMessage(message, ...args).then(onClick);
  },
  (message: string) => message.toLocaleLowerCase()
);

export const handleErrorMessage = memoize(
  (message: string, onClick = (action: string) => {}, ...args: string[]) => {
    setState({
      [StatePayload.MESSAGE]: { message_type: StateType.ERROR, message },
    });
    return window.showErrorMessage(message, ...args).then(onClick);
  },
  (message: string) => message.toLocaleLowerCase()
);

export const handleWarningMessage = memoize(
  (message: string, onClick = (action: string) => {}, ...args: string[]) => {
    setState({
      [StatePayload.MESSAGE]: { message_type: StateType.ERROR, message },
    });
    return window.showWarningMessage(message, ...args).then(onClick);
  },
  (message: string) => message.toLocaleLowerCase()
);

export function handleUserMessage({ user_message }) {
  user_message.length && handleInfoMessage(user_message.join(EOL));
}

export async function handleStartUpNotification(context: ExtensionContext) {
  let { cloud_enabled, is_cloud_capable } = await getState();

  once(ENABLED_CLOUD_NOTIFICATION_KEY, context).then(() => {
    handleCloudEnabling(is_cloud_capable, cloud_enabled);
  });
}

function handleCloudEnabling(
  is_cloud_capable: boolean,
  cloud_enabled: boolean
) {
  if (is_cloud_capable && !cloud_enabled) {
    handleInfoMessage(
      CLOUD_CAPABLE_NOT_ENABLED,
      onEnableCloudAction,
      ENABLED_CLOUD_ACTION
    );
  }
}

export function onEnableCloudAction(action: string): any {
  if (action === ENABLED_CLOUD_ACTION) {
    commands.executeCommand(
      CONFIG_COMMAND,
      StateType.NOTIFICATION,
      ENABLED_CLOUD_ACTION
    );
  }
}
