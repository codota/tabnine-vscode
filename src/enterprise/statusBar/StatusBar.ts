import {
  Disposable,
  ExtensionContext,
  authentication,
  window,
  workspace,
} from "vscode";
import { StatusItem } from "./StatusItem";
import { StatusState, showLoginNotification } from "./statusAction";
import { isHealthyServer } from "../update/isHealthyServer";
import { TABNINE_HOST_CONFIGURATION } from "../consts";
import { rejectOnTimeout } from "../../utils/utils";
import { getState, tabNineProcess } from "../../binary/requests/requests";
import {
  BINARY_NOTIFICATION_POLLING_INTERVAL,
  BRAND_NAME,
  CONGRATS_MESSAGE_SHOWN_KEY,
} from "../../globals/consts";
import getUserInfo, { UserInfo } from "../requests/UserInfo";
import { Logger } from "../../utils/logger";

export class StatusBar implements Disposable {
  private item: StatusItem;

  private statusPollingInterval: NodeJS.Timeout | undefined = undefined;

  private disposables: Disposable[] = [];

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.item = new StatusItem();
    void authentication.getSession(BRAND_NAME, []);
    this.disposables.push(
      authentication.onDidChangeSessions((e) => {
        if (e.provider.id === BRAND_NAME) {
          void this.checkIfLoggedIn();
        }
      })
    );
    this.setDefaultStatus();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.setServerRequired().catch(Logger.error);
  }

  private async setServerRequired() {
    this.item.setWarning("Please set your Tabnine server URL");

    if (await isHealthyServer()) {
      this.setDefaultStatus();
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
    this.item.setError("Tabnine failed to start, view logs for more details");
    this.item.setCommand(StatusState.ErrorWaitingForProcess);
  }

  private setGenericError(error: Error) {
    Logger.error(error);
    this.item.setError("Something went wrong");
    this.item.setCommand(StatusState.OpenLogs);
  }

  private setDefaultStatus() {
    this.item.setDefault();
    this.item.setCommand(StatusState.Ready);
  }

  private setLoginRequired() {
    this.item.setWarning("Please sign in to access Tabnine");
    this.item.setCommand(StatusState.LogIn);
    void this.checkIfLoggedIn();
  }

  private async checkIfLoggedIn() {
    const userInfo = await getUserInfo();
    if (userInfo?.isLoggedIn) {
      this.checkTeamMembership(userInfo);
    } else {
      showLoginNotification();
    }
  }

  private checkTeamMembership(userInfo: UserInfo | null | undefined) {
    this.setDefaultStatus();
    try {
      if (!userInfo?.team) {
        this.item.setWarning("You are not part of a team");
        this.item.setCommand(StatusState.NotPartOfTheTeam);
      } else {
        this.setReady();
      }
    } catch (error) {
      this.setGenericError(error as Error);
    }
  }

  private setReady() {
    void this.showFirstSuceessNotification();
    this.setDefaultStatus();
    this.statusPollingInterval = setInterval(() => {
      void getState().then(
        (state) => {
          if (state?.cloud_connection_health_status !== "Ok") {
            this.item.setWarning(
              "Connectivity issue - Tabnine is unable to reach the server"
            );
            this.item.setCommand(StatusState.ConnectivityIssue);
          } else {
            this.setDefaultStatus();
          }
        },
        (error) => this.setGenericError(error as Error)
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

  async showFirstSuceessNotification() {
    if (!(await this.context.globalState.get(CONGRATS_MESSAGE_SHOWN_KEY))) {
      await window.showInformationMessage(
        "Congratulations! Tabnine is up and running."
      );

      await this.context.globalState.update(CONGRATS_MESSAGE_SHOWN_KEY, true);
    }
  }
}
