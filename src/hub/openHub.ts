import { env } from "vscode";
import createHubWebView, { setHubWebViewUrl } from "./createHubWebView";
import { StatePayload, StateType } from "../globals/consts";
import { tabNineProcess } from "../binary/requests/requests";
import hubUri from "./hubUri";
import setState from "../binary/requests/setState";

export function openHubExternal(type: StateType, path?: string) {
  return async (args: string[] | null = null): Promise<void> => {
    const uri = await hubUri(type, path);
    if (uri) {
      env.openExternal(uri);
    }

    void setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
}

export default function openHub(type: StateType, path?: string) {
  return async (args: string[] | null = null): Promise<void> => {
    const uri = await hubUri(type, path);
    if (uri) {
      const panel = await createHubWebView(uri);
      panel.reveal();

      tabNineProcess.onRestart(() => {
        void hubUri(type, path).then(
          (newUri) => newUri && setHubWebViewUrl(newUri)
        );
      });
    }

    void setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
}
