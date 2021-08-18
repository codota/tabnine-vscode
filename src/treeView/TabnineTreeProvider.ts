/* eslint-disable class-methods-use-this */
import { Event, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import { getHubStructure } from "../binary/requests/hubStructure";
import { TABNINE_TREE_NAVIGATION_COMMAND } from "../globals/consts";
import navigate from "./navigate";
import TabnineTreeItem from "./TabnineTreeItem";

export default class TabnineTreeProvider
  implements TreeDataProvider<TabnineTreeItem> {
  onDidChangeTreeData?:
    | Event<void | TabnineTreeItem | null | undefined>
    | undefined;

  getTreeItem(element: TabnineTreeItem): TreeItem {
    return element as TreeItem;
  }

  getChildren(): ProviderResult<TabnineTreeItem[]> {
    void navigate();
    return getHubStructure().then((structure) =>
      structure?.navigation.map(
        (e) =>
          new TabnineTreeItem(e.title, {
            title: e.title,
            command: TABNINE_TREE_NAVIGATION_COMMAND,
            arguments: [e.view],
          })
      )
    );
  }
}
