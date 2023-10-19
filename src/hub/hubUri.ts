import { Uri } from "vscode";
import { StateType } from "../globals/consts";
import { configuration } from "../binary/requests/requests";
import { asExternal } from "../utils/asExternal";

export default async function hubUri(
  type: StateType,
  path?: string
): Promise<Uri | null> {
  const config = await configuration({ quiet: true, source: type });
  if (!config?.message) {
    return null;
  }

  return asExternal(config.message, path);
}
