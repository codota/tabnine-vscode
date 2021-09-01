import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import openHub from "../hub/openHub";

export default async function navigate(view?: string): Promise<void> {
  const config = await configuration({
    quiet: true,
    source: StateType.TREE_VIEW,
  });
  if (config && config.message) {
    const localUri = await env.asExternalUri(Uri.parse(config.message));
    void openHub(localUri, view);
  }
}
