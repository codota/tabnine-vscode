import { API_VERSION, TabNine, StateType, StatePayload } from "./TabNine";
import { window, commands } from "vscode";
import { EOL } from "os";
import { CONFIG_COMMAND } from "./commandsHandler";
const memoize = require('lodash.memoize');

const CONNECTION_ISSUE = "TabNine connection issues - Check your internet connection";
const CLOUD_CAPABLE_NOT_ENABLED = "You had registered to TabNine Professional but didn't enable the Deep Cloud";
const ENABLED_CLOUD_ACTION = "Enable Deep Cloud";
const FIRST_NOTIFICATION_DELAY = 10000;


export const handleInformationMessage = memoize((tabNine:TabNine, message: string, onClick = (action: string) => {},...args: string[]) => {
  tabNine.setState({ [StatePayload.message]: {message_type: StateType.info, message}});
  return window.showInformationMessage(message,...args).then(onClick);
}, (tabNine:TabNine, message: string) => message.toLocaleLowerCase());

export const handleErrorMessage = memoize((tabNine:TabNine, message: string, onClick = (action: string) => {},...args: string[]) => {
  tabNine.setState({ [StatePayload.message]: {message_type: StateType.error, message}});
  return window.showErrorMessage(message,...args).then(onClick);
}, (tabNine:TabNine, message: string) => message.toLocaleLowerCase());

export function handleUserMessage(tabNine: TabNine, { user_message }) {
  handleInformationMessage(tabNine, user_message.join(EOL));
}


export async function handleStartUpNotification(tabNine: TabNine) {
  let {
    cloud_enabled,
    is_cloud_capable,
    is_authenticated,
  } = await tabNine.request(API_VERSION, { State: {} });

  handleConnectivity(cloud_enabled, is_authenticated, tabNine);
  handleCloudEnabling(is_cloud_capable, cloud_enabled, tabNine);
}

function handleCloudEnabling(is_cloud_capable: boolean, cloud_enabled: boolean, tabNine: TabNine) {
  if (is_cloud_capable && !cloud_enabled) {
    handleInformationMessage(tabNine, CLOUD_CAPABLE_NOT_ENABLED, onEnableCloudAction, ENABLED_CLOUD_ACTION);
  }
};

function handleConnectivity(cloud_enabled: boolean, is_authenticated: boolean, tabNine: TabNine) {
  if (cloud_enabled && !is_authenticated) {
    setTimeout(async () => {
      let {
        cloud_enabled,
        is_authenticated, } = await tabNine.request(API_VERSION, { State: {} });

      if (cloud_enabled && !is_authenticated) {
        handleErrorMessage(tabNine, CONNECTION_ISSUE);
      }
    }, FIRST_NOTIFICATION_DELAY);
  }
}

function onEnableCloudAction(action: string): any {
  if (action === ENABLED_CLOUD_ACTION) {
    commands.executeCommand(CONFIG_COMMAND, StateType.notification);
  }
}

