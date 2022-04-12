import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";

// eslint-disable-next-line import/prefer-default-export
export async function getHubBaseUrl(
  source: StateType
): Promise<string | undefined> {
  const response = await configuration({
    quiet: true,
    source,
  });

  return (
    response?.message &&
    (await env.asExternalUri(Uri.parse(response.message))).toString()
  );
}
