import * as vscode from "vscode";
import { tabnineExtensionProperties } from "tabnine-vscode-common";
import updateTask from "./updateTask";
import confirmReload from "./confirmReload";

export default async function updateAndReload(serverUrl: string) {
  try {
    const updatedVersion = await updateTask(
      serverUrl,
      tabnineExtensionProperties.version
    );
    if (updatedVersion) {
      await confirmReload("Tabnine updated");
    } else {
      console.log("Tabnine updater - nothing to update");
    }
  } catch (e) {
    console.error("Failed to update Tabnine plugin", e);
    void vscode.window.showErrorMessage(
      "Failed to update Tabnine plugin (View Developer Tools for more details)"
    );
  }
}
