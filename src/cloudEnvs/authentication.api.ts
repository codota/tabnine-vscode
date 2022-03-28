import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";

export async function openLogin(): Promise<void> {
  return openBinaryConfig("sign_in");
}

export async function openLogout(): Promise<void> {
  return openBinaryConfig("sign_out");
}

async function openBinaryConfig(url: string): Promise<void> {
  const config = await configuration({ quiet: true, source: StateType.AUTH });
  if (config && config.message) {
    const localUri = await env.asExternalUri(Uri.parse(config.message));

    await env.openExternal(
      localUri.with({
        path: `${localUri.path}/${url}`,
      })
    );
  }
}
