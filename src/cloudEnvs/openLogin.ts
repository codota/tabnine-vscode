import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import createHubWebView from "../hub/createHubWebView";

export default async function openLogin(): Promise<void> {
  const config = await configuration({ quiet: true, source: StateType.AUTH });
  if (config?.message) {
    const localUri = await env.asExternalUri(Uri.parse(config.message));
    const callback = `https://app.tabnine.com/auth/sign-in?tabnineUrl=${localUri.toString()}&sync=false`;
    const panel = await createHubWebView(localUri);
    panel.reveal();
    void env.openExternal(Uri.parse(callback));
  }
}
