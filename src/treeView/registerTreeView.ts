import { commands, ExtensionContext, window } from "vscode";
import { getHubStructure } from "../binary/requests/hubStructure";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { TABNINE_TREE_NAVIGATION_COMMAND } from "../globals/consts";
import navigate from "./navigate";
import TabnineTreeProvider from "./TabnineTreeProvider";

export default async function registerTreeView(
  context: ExtensionContext
): Promise<void> {
  const isNavigationEnabled =
    isCapabilityEnabled(Capability.LEFT_TREE_VIEW) ||
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY);

  if (!isNavigationEnabled) {
    return;
  }
  const structure = await getHubStructure();

  if (structure) {
    void commands.executeCommand(
      "setContext",
      "tabnine.tabnine-navigation-ready",
      true
    );
    context.subscriptions.push(
      window.registerTreeDataProvider(
        "tabnine-home",
        new TabnineTreeProvider()
      ),
      commands.registerCommand(TABNINE_TREE_NAVIGATION_COMMAND, (view) => {
        void navigate(view);
      })
    );
  }
}
