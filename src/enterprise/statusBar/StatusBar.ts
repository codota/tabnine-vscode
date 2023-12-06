import { Disposable, ExtensionContext, window } from "vscode";
import { StatusItem } from "./StatusItem";
import { showPleaseLoginNotification } from "./statusAction";
import { CONGRATS_MESSAGE_SHOWN_KEY } from "../../globals/consts";
import StatusBarState from "./StatusBarState";
import { useDerviedState } from "../../state/deriveState";
import USER_INFO_STATE from "../lifecycle/UserInfoState";
import { StatusBarStateData } from "./calculateStatusBarState";

export class StatusBar implements Disposable {
  private item: StatusItem;

  private disposables: Disposable[] = [];

  private context: ExtensionContext;

  private statusBarState = new StatusBarState();

  constructor(context: ExtensionContext) {
    context.subscriptions.push(this);
    this.context = context;
    this.item = new StatusItem();

    this.disposables.push(
      this.statusBarState,
      this.statusBarState.onChange((statusBarData) => {
        this.updateStatusBar(statusBarData);
      }),
      useDerviedState(
        USER_INFO_STATE,
        (s) => s.isLoggedIn,
        (isLoggedIn) => {
          if (!isLoggedIn) {
            showPleaseLoginNotification();
          }
        }
      )
    );
  }

  private updateStatusBar(statusBarData: StatusBarStateData) {
    switch (statusBarData.type) {
      case "default":
        this.item.setDefault();
        void this.showFirstSuceessNotification();
        break;
      case "loading":
        this.item.setLoading();
        break;
      case "error":
        this.item.setError(statusBarData.message);
        break;
      case "warning":
        this.item.setWarning(statusBarData.message);
        break;
      default:
    }

    if (statusBarData.command) {
      this.item.setCommand(statusBarData.command);
    }
  }

  waitForProcess() {
    this.statusBarState.startWaitingForProcess();
  }

  public dispose() {
    this.item.dispose();
    Disposable.from(...this.disposables).dispose();
  }

  private async showFirstSuceessNotification() {
    if (!(await this.context.globalState.get(CONGRATS_MESSAGE_SHOWN_KEY))) {
      await window.showInformationMessage(
        "Congratulations! Tabnine is up and running."
      );

      await this.context.globalState.update(CONGRATS_MESSAGE_SHOWN_KEY, true);
    }
  }
}
