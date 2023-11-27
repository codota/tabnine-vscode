import { window, QuickPickItem } from "vscode";

export function showInput(
  items: QuickPickItem[] = []
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const view = window.createQuickPick();
    view.items = items;
    view.placeholder = `Ask Tabnine ${
      items.length ? " or select from the list" : ""
    }`;
    view.onDidAccept(() => {
      view.dispose();
      if (view.selectedItems.length) {
        resolve(view.selectedItems[0].label);
      }
      resolve(view.value);
    });
    view.onDidHide(() => {
      setImmediate(() => {
        view.dispose();
        resolve(undefined);
      });
    });
    view.show();
  });
}
