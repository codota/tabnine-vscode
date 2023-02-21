import { commands, ExtensionContext, window, env, Uri } from "vscode";
import {
  TABNINE_APP_URL,
  TABNINE_OPEN_APP_COMMAND,
} from "../globals/consts";
import TabnineTreeProvider from "./TabnineTreeProvider";

export default function registerTreeView(context: ExtensionContext): void {
  try {
    context.subscriptions.push(
      window.registerTreeDataProvider(
        "tabnine-home",
        new TabnineTreeProvider()
      ),
      commands.registerCommand(TABNINE_OPEN_APP_COMMAND, () => {
        void env.openExternal(Uri.parse(TABNINE_APP_URL));
      }),
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
