import { API_VERSION, TabNine, StateType, StatePayload } from "./TabNine";
import { window, commands, ExtensionContext } from "vscode";
import { EOL } from "os";
import { CONFIG_COMMAND } from "./commandsHandler";
import { once } from "./utils";
const memoize = require("lodash.memoize");

const CLOUD_CAPABLE_NOT_ENABLED =
  "You had registered to TabNine Professional but didn't enable the Deep Cloud";
const ENABLED_CLOUD_ACTION = "Enable Deep Cloud";
const ENABLED_CLOUD_NOTIFICATION_KEY = "tabnine.hide.enable-cloud.notification";

export const handleInfoMessage = memoize(
  (
    tabNine: TabNine,
    message: string,
    onClick = (action: string) => {},
    ...args: string[]
  ) => {
    tabNine.setState({
      [StatePayload.message]: { message_type: StateType.info, message },
    });
    return window.showInformationMessage(message, ...args).then(onClick);
  },
  (tabNine: TabNine, message: string) => message.toLocaleLowerCase()
);

export const handleErrorMessage = memoize(
  (
    tabNine: TabNine,
    message: string,
    onClick = (action: string) => {},
    ...args: string[]
  ) => {
    tabNine.setState({
      [StatePayload.message]: { message_type: StateType.error, message },
    });
    return window.showErrorMessage(message, ...args).then(onClick);
  },
  (tabNine: TabNine, message: string) => message.toLocaleLowerCase()
);

export const handleWarningMessage = memoize(
  (
    tabNine: TabNine,
    message: string,
    onClick = (action: string) => {},
    ...args: string[]
  ) => {
    tabNine.setState({
      [StatePayload.message]: { message_type: StateType.error, message },
    });
    return window.showWarningMessage(message, ...args).then(onClick);
  },
  (tabNine: TabNine, message: string) => message.toLocaleLowerCase()
);

export function handleUserMessage(tabNine: TabNine, { user_message }) {
  user_message.length && handleInfoMessage(tabNine, user_message.join(EOL));
}

export async function handleStartUpNotification(
  tabNine: TabNine,
  context: ExtensionContext
) {
  let { cloud_enabled, is_cloud_capable } = await tabNine.request(API_VERSION, {
    State: {},
  });

  once(ENABLED_CLOUD_NOTIFICATION_KEY, context).then(() => {
    handleCloudEnabling(is_cloud_capable, cloud_enabled, tabNine);
  });
}

function handleCloudEnabling(
  is_cloud_capable: boolean,
  cloud_enabled: boolean,
  tabNine: TabNine
) {
  if (is_cloud_capable && !cloud_enabled) {
    handleInfoMessage(
      tabNine,
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
      StateType.notification,
      ENABLED_CLOUD_ACTION
    );
  }
}
