import { Uri, env } from "vscode";
import createHubWebView, { setHubWebViewUrl } from "./createHubWebView";
import { StatePayload, StateType } from "../globals/consts";
import { tabNineProcess, configuration } from "../binary/requests/requests";
import setState from "../binary/requests/setState";

async function getHubUri(type: StateType, path?: string): Promise<Uri | null> {
  const config = await configuration({ quiet: true, source: type });
  if (config?.message) {
    const uri = Uri.parse(`${config.message}${path || ""}`);
    return env.asExternalUri(uri);
  }
  return null;
}

export default function openHub(type: StateType, path?: string) {
  return async (args: string[] | null = null): Promise<void> => {
    const hubUri = await getHubUri(type, path);
    if (hubUri) {
      const panel = await createHubWebView(hubUri);
      panel.reveal();

      tabNineProcess.onRestart(() => {
        void getHubUri(type, path).then(
          (newHubUri) => newHubUri && setHubWebViewUrl(newHubUri)
        );
      });
    }

    void setState({
      [StatePayload.STATE]: { state_type: args?.join("-") || type },
    });
  };
}
