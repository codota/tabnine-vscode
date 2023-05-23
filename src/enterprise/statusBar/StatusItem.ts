import {
  Disposable,
  StatusBarAlignment,
  StatusBarItem,
  ThemeColor,
  commands,
  window,
} from "vscode";
import { FULL_BRAND_REPRESENTATION } from "../../globals/consts";
import { StatusState, action } from "./statusAction";

const commandId = "tabnine.enterprise.status.handler";

export class StatusItem implements Disposable {
  private item: StatusBarItem;
  private comand: Disposable;

  constructor() {
    this.item = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    this.comand = commands.registerCommand(commandId, action);
    this.item.show();
  }
  dispose() {
    this.item.dispose();
    this.comand.dispose();
  }
  public setDefault() {
    this.item.backgroundColor = undefined;
    this.item.tooltip = `${FULL_BRAND_REPRESENTATION} (Click to open settings)`;
    this.item.text = "Tabnine";
  }
  public setLoading() {
    this.item.text = "$(loading~spin) Tabnine";
    this.item.backgroundColor = undefined;
    this.item.tooltip = "Starting tabnine process, please wait...";
  }
  public setError() {
    this.item.text = "$(warning) Tabnine";
    this.item.backgroundColor = new ThemeColor("statusBarItem.errorBackground");
    this.item.tooltip = "Tabnine failed to start, view logs for more details";
  }
  public setWarning(message: string) {
    this.item.backgroundColor = new ThemeColor(
      "statusBarItem.warningBackground"
    );
    this.item.tooltip = message;
    this.item.text = "Tabnine";
  }

  public setCommand(state: StatusState) {
    this.item.command = {
      title: "Status action",
      command: commandId,
      arguments: [state],
    };
  }
}
