import { commands, ExtensionContext, window, env, Uri } from "vscode";
import {
  BIGCODE_PROJECT_URL,
  BIGCODE_OPEN_WEB_COMMAND,
} from "../globals/consts";
import TabnineTreeProvider from "./TabnineTreeProvider";

export default function registerTreeView(context: ExtensionContext): void {
  try {
    context.subscriptions.push(
      window.registerTreeDataProvider(
        "tabnine-home",
        new TabnineTreeProvider()
      ),
      commands.registerCommand(BIGCODE_OPEN_WEB_COMMAND, () => {
        void env.openExternal(Uri.parse(BIGCODE_PROJECT_URL));
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
