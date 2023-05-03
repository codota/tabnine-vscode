import { Uri, workspace } from "vscode";
import {
  SELF_HOSTED_SERVER_CONFIGURATION,
  TABNINE_HOST_CONFIGURATION,
} from "../consts";

export default function serverUrl(): string | undefined {
  const oldUrl = workspace
    .getConfiguration()
    .get<string>(SELF_HOSTED_SERVER_CONFIGURATION);
  const url =
    workspace.getConfiguration().get<string>(TABNINE_HOST_CONFIGURATION) ||
    oldUrl;

  validateUrl(url);
  return url;
}
function validateUrl(url: string | undefined) {
  try {
    Uri.parse(url || "", true);
  } catch (error) {
    console.error("Tabnine updater - wrong server url");
  }
}
