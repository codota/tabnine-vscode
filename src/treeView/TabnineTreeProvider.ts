/* eslint-disable class-methods-use-this */
import { Event, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import {
  TABNINE_OPEN_APP_COMMAND,
} from "../globals/consts";
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
    return [
      new TabnineTreeItem("Manage your team", {
        title: "Manage your team",
        command: TABNINE_OPEN_APP_COMMAND,
        arguments: [],
      }),
    ];
  }
}
