/* eslint-disable class-methods-use-this */
import { Event, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import { getHubStructure } from "../binary/requests/hubStructure";
import { TABNINE_TREE_NAVIGATION_COMMAND } from "../globals/consts";
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
    return getHubStructure().then((structure) =>
      structure?.navigation.map(
        ({ title, view }) =>
          new TabnineTreeItem(title, {
            title,
            command: TABNINE_TREE_NAVIGATION_COMMAND,
            arguments: [view],
          })
      )
    );
  }
}
