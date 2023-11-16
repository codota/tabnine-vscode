import { window } from "vscode";
import { Logger } from "./logger";

export async function notifyOnError<T>(
  action: (this: void) => Promise<T>,
  message: string
): Promise<T | undefined> {
  try {
    return await action();
  } catch (e) {
    Logger.error(message, e);
    void window
      .showErrorMessage(
        "Something went wrong, check Tabnine log output for more details",
        "Show Log"
      )
      .then((selection) => {
        if (selection === "Show Log") {
          Logger.show();
        }
      });
    return undefined;
  }
}
