import createHubWebView, { setHubWebViewUrl } from "./createHubWebView";
import { StateType } from "../globals/consts";
import { tabNineProcess } from "../binary/requests/requests";
import hubUri from "./hubUri";

export default function openHub(type: StateType, path?: string) {
  return async (args: string[] | null = null): Promise<void> => {
    console.log(args);
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

    // void setState({
    //   [StatePayload.STATE]: { state_type: args?.join("-") || type },
    // });
  };
}
