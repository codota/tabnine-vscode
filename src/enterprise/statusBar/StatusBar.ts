import { Disposable, authentication, workspace } from "vscode";
import { StatusItem } from "./StatusItem";
import { StatusState, showLoginNotification } from "./statusAction";
import { isHealthyServer } from "../update/isHealthyServer";
import { TABNINE_HOST_CONFIGURATION } from "../consts";
import { rejectOnTimeout } from "../../utils/utils";
import { getState, tabNineProcess } from "../../binary/requests/requests";
import {
  BINARY_NOTIFICATION_POLLING_INTERVAL,
  BRAND_NAME,
} from "../../globals/consts";

export class StatusBar implements Disposable {
  private item: StatusItem;

  private statusPollingInterval: NodeJS.Timeout | undefined = undefined;

  private disposables: Disposable[] = [];

  constructor() {
    this.item = new StatusItem();
    this.disposables.push(
      authentication.onDidChangeSessions((e) => {
        if (e.provider.id === BRAND_NAME) {
          this.setLoginRequired();
        }
      })
    );
    this.item.setDefault();
    this.item.setCommand(StatusState.Ready);

    this.setServerRequired().catch(console.error);
  }

  private async setServerRequired() {
    this.item.setWarning("Please set your Tabnine server URL");

    if (await isHealthyServer()) {
      this.item.setDefault();
      this.waitForProcess();
    } else {
      this.item.setCommand(StatusState.SetServer);
      this.disposables.push(
        workspace.onDidChangeConfiguration((event) => {
          if (event.affectsConfiguration(TABNINE_HOST_CONFIGURATION)) {
            void isHealthyServer().then((isHealthy) => {
              if (isHealthy) {
                this.waitForProcess();
              }
            });
          }
        })
      );
    }
  }

  private waitForProcess() {
    this.item.setLoading();
    this.item.setCommand(StatusState.WaitingForProcess);

    rejectOnTimeout(tabNineProcess.onReady, 2000).then(
      () => this.setLoginRequired(),
      () => this.setProcessTimedoutError()
    );
  }

  private setProcessTimedoutError() {
    this.item.setError();
    this.item.setCommand(StatusState.ErrorWaitingForProcess);
  }

  private setLoginRequired() {
    this.item.setWarning("Please sign in using your Tabnine account.");
    this.item.setCommand(StatusState.LogIn);
    this.checkIfLoggedIn();
  }

  private checkIfLoggedIn() {
    void authentication
      .getSession(BRAND_NAME, [], { createIfNone: true })
      .then(() => this.setReady(), showLoginNotification);
  }

  private setReady() {
    this.item.setDefault();
    this.item.setCommand(StatusState.Ready);
    this.statusPollingInterval = setInterval(() => {
      void getState().then(
        (state) => {
          if (state?.cloud_connection_health_status !== "Ok") {
            this.item.setWarning("Server connectivity issue");
          } else {
            this.item.setDefault();
            this.item.setCommand(StatusState.Ready);
          }
        },
        (error) => {
          console.error(error);
          this.setProcessTimedoutError();
        }
      );
    }, BINARY_NOTIFICATION_POLLING_INTERVAL);
  }

  public dispose() {
    this.item.dispose();
    Disposable.from(...this.disposables).dispose();
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
    }
  }
}
