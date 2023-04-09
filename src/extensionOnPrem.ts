import * as vscode from "vscode";
import {
  deactivate as requestDeactivate,
  initBinary,
} from "./binary/requests/requests";
import { registerCommands } from "./commandsHandler";
import { registerStatusBar, setDefaultStatus } from "./statusBar/statusBar";
import { setBinaryRootPath } from "./binary/paths";
import { setTabnineExtensionContext } from "./globals/tabnineExtensionContext";

import { handleSelection } from "./extension";
import installAutocomplete from "./autocompleteInstaller";
import pollStatuses from "./statusBar/pollStatusBar";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";

const samsungDivisions = [
  "Mobile eXperience",
  "Visual Display",
  "Networks",
  "Digital Appliances",
  "Health & Medical Equipment",
  "Samsung Research",
  "Other",
];

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  console.log("*****THIS IS AN ONPREM BUILD****");
  setTabnineExtensionContext(context);
  handleSelection(context);
  registerStatusBar(context);
  await getCloudUrlAndBusinessDivisions();
  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering TabNine ready to operate.
  void backgroundInit(context);
  return Promise.resolve();
}

async function backgroundInit(context: vscode.ExtensionContext) {
  await setBinaryRootPath(context);
  await initBinary();
  pollStatuses(context);
  setDefaultStatus();

  void registerCommands(context);
  await installAutocomplete(context);
}

export async function deactivate(): Promise<unknown> {
  return requestDeactivate();
}
async function getCloudUrlAndBusinessDivisions(): Promise<void> {
  const { businessDivision, cloudHost } = tabnineExtensionProperties;
  if (businessDivision && cloudHost) {
    return;
  }

  const configuration = vscode.workspace.getConfiguration();

  if (!cloudHost) {
    const userCloudHost = await vscode.window.showInputBox({
      prompt: "No Cloud Host is set. Please set a Cloud Host:",
      placeHolder: "Set server URL",
      ignoreFocusOut: true,
    });
    if (userCloudHost) {
      await configuration.update("tabnine.cloudHost", userCloudHost, true);
    }
  }

  if (!businessDivision) {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Welcome to Tabnine, Please select a Business Division";
    quickPick.canSelectMany = false;
    quickPick.ignoreFocusOut = true;
    quickPick.items = samsungDivisions.map((label) => ({ label }));
    quickPick.onDidChangeSelection(async (selection) => {
      if (selection[0]?.label) {
        await configuration.update(
          "tabnine.businessDivision",
          selection[0].label,
          true
        );
        quickPick.hide();
      }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  }
}
