import { StatusBarItem } from "vscode";

export default class StatusBarPromotionItem {
  id: string | undefined;

  item: StatusBarItem;

  constructor(item: StatusBarItem, id?: string) {
    this.id = id;
    this.item = item;
  }
}
