import * as vscode from "vscode";
import TabnineItem from "./TabnineItem";

export default class TabnineProvider
  implements vscode.TreeDataProvider<TabnineItem> {
  onDidChangeTreeData?:
    | vscode.Event<void | TabnineItem | null | undefined>
    | undefined;

  structure = [
    {
      title: "Home",
      view: "home",
    },
    {
      title: "Status",
      view: "status",
    },
    {
      title: "Preferences",
      view: "preferences",
    },
    {
      title: "Info",
      view: "installation-info",
    },
  ];

  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: TabnineItem): vscode.TreeItem {
    return element as vscode.TreeItem;
  }

  // eslint-disable-next-line class-methods-use-this
  getChildren(): vscode.ProviderResult<TabnineItem[]> {
    const treeView = this.structure.map(
      (e) =>
        new TabnineItem(e.title, {
          title: e.title,
          command: "tabnine:navigation",
          arguments: [e.view],
        })
    );
    return Promise.resolve(treeView);
  }
}
