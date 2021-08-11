import { commands, ExtensionContext, window } from "vscode";
import { getHubStructure } from "../binary/requests/hubStructure";
import { TABNINE_TREE_NAVIGATION_COMMAND } from "../globals/consts";
import open from "../hub/hubNavigation";
import TabnineTreeProvider from "./TabnineTreeProvider";

export default async function registerTreeView(context: ExtensionContext): Promise<void> {
  
  const structure = await getHubStructure();
  
  if (structure) { 
    void commands.executeCommand(
      "setContext",
      "tabnine.tabnine-navigation-ready",
      true
    );
    context.subscriptions.push(
      window.registerTreeDataProvider("tabnine-home", new TabnineTreeProvider()),
      commands.registerCommand(TABNINE_TREE_NAVIGATION_COMMAND, (view) => {
        void open(view);
      })
    );
  }
}
