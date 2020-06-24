import { API_VERSION, TabNine } from "./TabNine";
import { window } from "vscode";
import { EOL } from 'os';

const connectionIssueError = "TabNine connection issues - Check your internet connection";
const cloudCapableNotEnabled = "You had registered to TabNine Professional but didn't enable the Deep Cloud";

const FIRST_NOTIFICATION_DELAY = 10000;
let lastUserMessage = "";

export function registerNotifications(tabNine: TabNine){
    handleNotification(tabNine);
}

export function handleUserMessage({user_message}){
    let detailMessage = user_message.join(EOL);
          if (lastUserMessage.localeCompare(detailMessage)){
            window.showInformationMessage(detailMessage);
            lastUserMessage = detailMessage;
          }
}

export async function handleNotification(tabNine: TabNine){
    let { 
        cloud_enabled,
        is_cloud_capable,
        is_authenticated,
    } = await tabNine.request(API_VERSION, { State: { } });

    if (cloud_enabled && !is_authenticated){
        setTimeout(async () => {
            let { cloud_enabled, is_authenticated, } = await tabNine.request(API_VERSION, { State: { } });

            if (cloud_enabled && !is_authenticated){
                window.showErrorMessage(connectionIssueError);
            }

          }, FIRST_NOTIFICATION_DELAY);
    }
    if (is_cloud_capable && !cloud_enabled){
        window.showInformationMessage(cloudCapableNotEnabled, "Enable the Deep Cloud");
    }
}