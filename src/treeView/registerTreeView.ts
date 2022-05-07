import { commands, ExtensionContext, window, env, Uri } from "vscode";
import openUrl from "../binary/requests/openUrl";
import { fireEvent } from "../binary/requests/requests";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import {
  TABNINE_APP_URL,
  TABNINE_OPEN_APP_COMMAND,
  TABNINE_TREE_NAVIGATION_COMMAND,
} from "../globals/consts";
import navigate from "./navigate";
import TabnineTreeProvider from "./TabnineTreeProvider";

export default function registerTreeView(context: ExtensionContext): void {
  try {
    const provider = new TabnineTreeProvider();
    context.subscriptions.push(
      window.registerTreeDataProvider("tabnine-home", provider),
      commands.registerCommand(TABNINE_TREE_NAVIGATION_COMMAND, (view) => {
        void navigate(view);
        void fireEvent({
          name: "hub-opened-from-sidebar",
        });
      }),
      commands.registerCommand(TABNINE_OPEN_APP_COMMAND, () => {
        if (isCapabilityEnabled(Capability.NOTIFICATIONS_WIDGET)) {
          void openUrl(TABNINE_APP_URL);
        } else {
          void env.openExternal(Uri.parse(TABNINE_APP_URL));
        }

        void fireEvent({
          name: "tabnine-app-opened-from-sidebar",
        });
      })
    );
    window.createTreeView("tabnine-home", {
      treeDataProvider: provider,
    }).badge = { value: 42, tooltip: "tabnine" };
    void commands.executeCommand(
      "setContext",
      "tabnine.tabnine-navigation-ready",
      true
    );
  } catch (e) {
    console.error("Error in registerTreeView", e);
  }
}
