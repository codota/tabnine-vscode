/* eslint-disable class-methods-use-this */
import { Event, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import {
  BIGCODE_OPEN_WEB_COMMAND,
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
      new TabnineTreeItem("Read about BigCode project", {
        title: "Read about BigCode project",
        command: BIGCODE_OPEN_WEB_COMMAND,
        arguments: [],
      }),
    ];
  }
}
