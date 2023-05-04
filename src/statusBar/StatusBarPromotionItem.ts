import { Disposable, StatusBarItem } from "vscode";

export default class StatusBarPromotionItem implements Disposable {
  id: string | undefined;

  item: StatusBarItem;

  constructor(item: StatusBarItem, id?: string) {
    this.id = id;
    this.item = item;
  }

  dispose() {
    this.item.dispose();
  }
}
