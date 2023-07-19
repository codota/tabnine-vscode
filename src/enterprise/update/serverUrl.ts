import { Uri, workspace } from "vscode";
import {
  SELF_HOSTED_SERVER_CONFIGURATION,
  TABNINE_HOST_CONFIGURATION,
} from "../consts";
import { Logger } from "../../utils/logger";

export default function serverUrl(): string | undefined {
  const oldUrl = workspace
    .getConfiguration()
    .get<string>(SELF_HOSTED_SERVER_CONFIGURATION);
  const url =
    workspace.getConfiguration().get<string>(TABNINE_HOST_CONFIGURATION) ||
    oldUrl;

  return url;
}
export function validateUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  try {
    Uri.parse(url || "", true);
    return true;
  } catch (error) {
    Logger.error("Tabnine updater - wrong server url");
    return false;
  }
}
