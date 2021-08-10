import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import openHub from "./openHub";

export default async function open(view: string): Promise<void> {
  const config = await configuration({
    quiet: true,
    source: StateType.PALLETTE,
  });
  if (config && config.message) {
    const localUri = await env.asExternalUri(
      Uri.parse(`${config.message}#${view}`)
    );
    void openHub(localUri);
  }
}
