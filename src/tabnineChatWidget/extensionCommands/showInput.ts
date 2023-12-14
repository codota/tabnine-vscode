import { QuickPickItem, window } from "vscode";

export function showInput<
  T extends QuickPickItem & { multistep: boolean; intent: string }
>(items: T[] = []): Promise<[string?, T?]> {
  return new Promise((resolve) => {
    let isAccepted = false;
    const view = window.createQuickPick<T>();
    view.items = items;
    view.title = "Ask Tabnine";
    view.canSelectMany = false;
    view.placeholder = `Type your question${
      items.length ? " or select from the list" : ""
    }`;
    view.onDidAccept(() => {
      view.hide();
      isAccepted = true;
    });

    view.onDidHide(() => {
      if (!isAccepted) {
        resolve([]);
        view.dispose();
        return;
      }
      if (view.selectedItems.length) {
        if (view.selectedItems[0].multistep) {
          void window
            .showInputBox({
              placeHolder: view.selectedItems[0].description,
            })
            .then(
              (value) => {
                if (value) {
                  resolve([
                    `${view.selectedItems[0].intent} ${value}`,
                    view.selectedItems[0],
                  ]);
                } else {
                  resolve([]);
                }
                view.dispose();
              },
              () => {
                resolve([]);
                view.dispose();
              }
            );
        } else {
          resolve([view.selectedItems[0].intent, view.selectedItems[0]]);
          view.dispose();
        }
      } else {
        resolve([view.value]);
        view.dispose();
      }
    });
    view.show();
  });
}
