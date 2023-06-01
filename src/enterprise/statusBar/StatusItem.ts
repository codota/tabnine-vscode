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

const STATUS_NAME = "Tabnine Enterprise";
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
    this.item.text = STATUS_NAME;
  }

  public setLoading() {
    this.item.text = `$(loading~spin) ${STATUS_NAME}`;
    this.item.backgroundColor = undefined;
    this.item.tooltip = "Starting tabnine process, please wait...";
  }

  public setError(message: string) {
    this.item.text = `$(warning) ${STATUS_NAME}`;
    this.item.backgroundColor = new ThemeColor("statusBarItem.errorBackground");
    this.item.tooltip = message;
  }

  public setWarning(message: string) {
    this.item.backgroundColor = new ThemeColor(
      "statusBarItem.warningBackground"
    );
    this.item.tooltip = message;
    this.item.text = STATUS_NAME;
  }

  public setCommand(state: StatusState) {
    this.item.command = {
      title: "Status action",
      command: commandId,
      arguments: [state],
    };
  }
}
