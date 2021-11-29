import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";

export async function callForLogin(): Promise<void> {
  const config = await configuration({ quiet: true, source: StateType.AUTH });
  if (config?.message) {
    const localUri = await env.asExternalUri(Uri.parse(config.message));

    const loginUrl = localUri.with({
      path: `${localUri.path}/signin`,
    });

    void env.openExternal(loginUrl);
  }
}

export async function callForLogout(): Promise<void> {
  const config = await configuration({ quiet: true, source: StateType.AUTH });
  if (config && config.message) {
    const localUri = await env.asExternalUri(Uri.parse(config.message));

    const logOutUrl = localUri.with({
      path: `${localUri.path}/logout`,
    });

    await env.openExternal(logOutUrl);
  }
}
