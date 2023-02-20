import { commands, ExtensionContext, window, env, Uri } from "vscode";
import { fireEvent } from "../binary/requests/requests";
import {
  TABNINE_APP_URL,
  TABNINE_OPEN_APP_COMMAND,
  TABNINE_OPEN_GETTING_STARTED_COMMAND,
  TABNINE_TREE_NAVIGATION_COMMAND,
} from "../globals/consts";
import { openGettingStartedWebview } from "../webview/openGettingStartedWebview";
import navigate from "./navigate";
import TabnineTreeProvider from "./TabnineTreeProvider";

export default function registerTreeView(context: ExtensionContext): void {
  try {
    context.subscriptions.push(
      window.registerTreeDataProvider(
        "tabnine-home",
        new TabnineTreeProvider()
      ),
      commands.registerCommand(TABNINE_TREE_NAVIGATION_COMMAND, (view) => {
        void navigate(view as string);
        void fireEvent({
          name: "hub-opened-from-sidebar",
        });
      }),
      commands.registerCommand(TABNINE_OPEN_APP_COMMAND, () => {
        void env.openExternal(Uri.parse(TABNINE_APP_URL));

        void fireEvent({
          name: "tabnine-app-opened-from-sidebar",
        });
      }),
      commands.registerCommand(TABNINE_OPEN_GETTING_STARTED_COMMAND, () => {
        openGettingStartedWebview(context);
        void fireEvent({
          name: "getting-started-opened-from-sidebar",
        });
      })
    );
    void commands.executeCommand(
      "setContext",
      "tabnine.tabnine-navigation-ready",
      true
    );
  } catch (e) {
    console.error("Error in registerTreeView", e);
  }
}
