import { Disposable, ExtensionContext, authentication, window } from "vscode";
import { StatusItem } from "./StatusItem";
import { StatusState, showLoginNotification } from "./statusAction";
import { isHealthyServer } from "../update/isHealthyServer";
import { rejectOnTimeout } from "../../utils/utils";
import { getState, tabNineProcess } from "../../binary/requests/requests";
import {
  BINARY_NOTIFICATION_POLLING_INTERVAL,
  BRAND_NAME,
  CONGRATS_MESSAGE_SHOWN_KEY,
} from "../../globals/consts";
import getUserInfo, { UserInfo } from "../requests/UserInfo";
import { Logger } from "../../utils/logger";
import { completionsState } from "../../state/completionsState";

export class StatusBar implements Disposable {
  private item: StatusItem;

  private statusPollingInterval: NodeJS.Timeout | undefined = undefined;

  private disposables: Disposable[] = [];

  private context: ExtensionContext;

  constructor(context: ExtensionContext) {
    context.subscriptions.push(this);
    this.context = context;
    this.item = new StatusItem();
    void authentication.getSession(BRAND_NAME, []);
    this.disposables.push(
      authentication.onDidChangeSessions((e) => {
        if (e.provider.id === BRAND_NAME) {
          void this.enforceLogin();
        }
      })
    );
    this.setDefaultStatus();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.setServerRequired().catch(Logger.error);

    completionsState.on("changed", () => this.setDefaultStatus());
  }

  private async setServerRequired() {
    Logger.debug("Checking if server url is set and healthy.");
    if (await isHealthyServer()) {
      Logger.debug("Server is healthy");
      this.setDefaultStatus();
    } else {
      Logger.warn("Server url isn't set or not responding to GET /health");
      this.item.setWarning("Please set your Tabnine server URL");
      this.item.setCommand(StatusState.SetServer);
    }
  }

  public waitForProcess() {
    Logger.debug("Waiting for Tabnine process to become ready.");
    this.item.setLoading();
    this.item.setCommand(StatusState.WaitingForProcess);

    rejectOnTimeout(tabNineProcess.onReady, 10_000).then(
      () => this.enforceLogin(),
      () => this.setProcessTimedoutError()
    );
  }

  private setProcessTimedoutError() {
    Logger.error("Timedout waiting for Tabnine process to become ready.");
    this.item.setError("Tabnine failed to start, view logs for more details");
    this.item.setCommand(StatusState.ErrorWaitingForProcess);
  }

  private setGenericError(error: Error) {
    Logger.error(error);
    this.item.setError("Something went wrong");
    this.item.setCommand(StatusState.OpenLogs);
  }

  private setDefaultStatus() {
    if (!completionsState.value) {
      this.item.setCompletionsDisabled();
    } else {
      this.item.setDefault();
    }
    this.item.setCommand(StatusState.Ready);
  }

  private async enforceLogin() {
    const userInfo = await getUserInfo();
    if (userInfo?.isLoggedIn) {
      Logger.debug("The user is logged in.");
      void window.showInformationMessage(
        `You are currently logged in as ${userInfo.email}`
      );
      this.checkTeamMembership(userInfo);
    } else {
      Logger.info(
        "The user isn't logged in, set status bar and showing notification"
      );
      this.item.setWarning("Please sign in to access Tabnine");
      this.item.setCommand(StatusState.LogIn);
      showLoginNotification();
    }
  }

  private checkTeamMembership(userInfo: UserInfo | null | undefined) {
    this.setDefaultStatus();
    try {
      if (!userInfo?.team) {
        Logger.warn("User isn't part of a team");
        this.item.setWarning("You are not part of a team");
        this.item.setCommand(StatusState.NotPartOfTheTeam);
      } else {
        Logger.debug("Everything seems to be fine, we are ready!");
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

  private async showFirstSuceessNotification() {
    if (!(await this.context.globalState.get(CONGRATS_MESSAGE_SHOWN_KEY))) {
      await window.showInformationMessage(
        "Congratulations! Tabnine is up and running."
      );

      await this.context.globalState.update(CONGRATS_MESSAGE_SHOWN_KEY, true);
    }
  }
}
