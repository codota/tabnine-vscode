import { API_VERSION, TabNine, StateType, StatePayload } from "./TabNine";
import { window, commands } from "vscode";
import { EOL } from "os";
import { CONFIG_COMMAND } from "./commandsHandler";
const memoize = require('lodash.memoize');

const CONNECTION_ISSUE = "TabNine deep cloud requires an active internet connection. Please check your connection. You can still work locally with TabNine deep local";
const CONNECTION_ISSUE_WARNING = "TabNine deep cloud requires an active internet connection, please check your internet connection and reconnect again";
const CLOUD_CAPABLE_NOT_ENABLED = "You had registered to TabNine Professional but didn't enable the Deep Cloud";
const ENABLED_CLOUD_ACTION = "Enable Deep Cloud";

const FIRST_NOTIFICATION_DELAY = 10000;


export const handleInfoMessage = memoize((tabNine:TabNine, message: string, onClick = (action: string) => {},...args: string[]) => {
  tabNine.setState({ [StatePayload.message]: {message_type: StateType.info, message}});
  return window.showInformationMessage(message,...args).then(onClick);
}, (tabNine:TabNine, message: string) => message.toLocaleLowerCase());

export const handleErrorMessage = memoize((tabNine:TabNine, message: string, onClick = (action: string) => {},...args: string[]) => {
  tabNine.setState({ [StatePayload.message]: {message_type: StateType.error, message}});
  return window.showErrorMessage(message,...args).then(onClick);
}, (tabNine:TabNine, message: string) => message.toLocaleLowerCase());


export const handleWarningMessage = memoize((tabNine:TabNine, message: string, onClick = (action: string) => {},...args: string[]) => {
  tabNine.setState({ [StatePayload.message]: {message_type: StateType.error, message}});
  return window.showWarningMessage(message,...args).then(onClick);
}, (tabNine:TabNine, message: string) => message.toLocaleLowerCase());

export function handleUserMessage(tabNine: TabNine, { user_message }) {
  handleInfoMessage(tabNine, user_message.join(EOL));
}


export async function handleStartUpNotification(tabNine: TabNine) {
  let {
    cloud_enabled,
    local_enabled,
    is_cloud_capable,
    is_authenticated
  } = await tabNine.request(API_VERSION, { State: {} });

  handleConnectivity(cloud_enabled, local_enabled, is_authenticated, tabNine);
  handleCloudEnabling(is_cloud_capable, cloud_enabled, tabNine);
}

function handleCloudEnabling(is_cloud_capable: boolean, cloud_enabled: boolean, tabNine: TabNine) {
  if (is_cloud_capable && !cloud_enabled) {
    handleInfoMessage(tabNine, CLOUD_CAPABLE_NOT_ENABLED, onEnableCloudAction, ENABLED_CLOUD_ACTION);
  }
};

function handleConnectivity(cloud_enabled: boolean, local_enabled: boolean, is_authenticated: boolean, tabNine: TabNine) {
  if (!is_authenticated) {
    setTimeout(async () => {
      let {
        cloud_enabled,
        local_enabled,
        is_authenticated, } = await tabNine.request(API_VERSION, { State: {} });

      if (cloud_enabled && !is_authenticated) {
        if (!local_enabled){
          handleErrorMessage(tabNine, CONNECTION_ISSUE, onEnableCloudAction, ENABLED_CLOUD_ACTION);
        } else {
          handleWarningMessage(tabNine, CONNECTION_ISSUE_WARNING);
        }
      }
    }, FIRST_NOTIFICATION_DELAY);
  }
}

export function onEnableCloudAction(action: string): any {
  if (action === ENABLED_CLOUD_ACTION) {
    commands.executeCommand(CONFIG_COMMAND, StateType.notification, ENABLED_CLOUD_ACTION);
  }
}

