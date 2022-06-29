import { env } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import openHub from "../hub/openHub";
import { getExternalUri } from "../utils/utils";

export default async function navigate(view?: string): Promise<void> {
  const config = await configuration({
    quiet: true,
    source: StateType.TREE_VIEW,
  });
  if (config && config.message) {
    const localUri = await env.asExternalUri(getExternalUri(config.message));
    void openHub(localUri, view);
  }
}
