import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import openHub from "../hub/openHub";
import { getExternalUri } from "../utils/utils";

export default async function openLogin(): Promise<void> {
  const config = await configuration({ quiet: true, source: StateType.AUTH });
  if (config && config.message) {
    const localUri = await env.asExternalUri(getExternalUri(config.message));
    const callback = `https://app.tabnine.com/auth/sign-in?tabnineUrl=${localUri.toString()}&sync=false`;
    await openHub(localUri);
    void env.openExternal(Uri.parse(callback));
  }
}
