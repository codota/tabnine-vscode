import { commands } from "vscode";
import confirm from "./confirm";
import { CONFIGURATION_SET_LABEL, OPEN_SETTINGS_COMMAND } from "../consts";
import { TABNINE_HOST_CONFIGURATION } from "../../globals/consts";

export default async function confirmServerUrl(): Promise<void> {
  if (
    await confirm(
      "Set Tabnine server URL to update Tabnine plugin",
      CONFIGURATION_SET_LABEL
    )
  ) {
    void commands.executeCommand(
      OPEN_SETTINGS_COMMAND,
      `@id:${TABNINE_HOST_CONFIGURATION}`
    );
  }
}
