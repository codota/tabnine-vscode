import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import createHubWebView from "../hub/createHubWebView";

export default async function navigate(view?: string): Promise<void> {
  const config = await configuration({
    quiet: true,
    source: StateType.TREE_VIEW,
  });
  if (config?.message) {
    const localUri = await env.asExternalUri(Uri.parse(config.message));
    const panel = await createHubWebView(localUri, view);
    panel.reveal();
  }
}
