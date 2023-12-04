import { QuickPickItem, window } from "vscode";

export function showInput<
  T extends QuickPickItem & { multistep: boolean; intent: string }
>(items: T[] = []): Promise<string | undefined> {
  return new Promise((resolve) => {
    const view = window.createQuickPick<T>();
    view.items = items;
    view.title = "Ask Tabnine";
    view.canSelectMany = false;
    view.ignoreFocusOut = true;
    view.placeholder = `Type your question${
      items.length ? " or select from the list" : ""
    }`;
    view.onDidAccept(() => {
      view.hide();
    });

    view.onDidHide(() => {
      if (view.selectedItems.length) {
        if (view.selectedItems[0].multistep) {
          void window
            .showInputBox({
              placeHolder: view.selectedItems[0].description,
              ignoreFocusOut: true,
            })
            .then(
              (value) => {
                if (value) {
                  resolve(`${view.selectedItems[0].intent} ${value}`);
                } else {
                  resolve(undefined);
                }
                view.dispose();
              },
              () => {
                resolve(undefined);
                view.dispose();
              }
            );
        } else {
          resolve(view.selectedItems[0].intent);
          view.dispose();
        }
      } else {
        resolve(view.value);
        view.dispose();
      }
    });
    view.show();
  });
}
