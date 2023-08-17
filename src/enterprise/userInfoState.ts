import * as vscode from "vscode";
import { isEqual } from "lodash";
import getUserInfo, { UserInfo } from "./requests/UserInfo";

const USER_INFO_REFRESH_INTERVAL_MS = 2_000;

class UserInfoStateRefresher implements vscode.Disposable {
  interval?: NodeJS.Timer;

  userInfoState: UserInfo | null = null;

  onChangeEventEmitter = new vscode.EventEmitter<UserInfo | null>();

  start() {
    const refreshFunction = this.refresh.bind(this);

    this.interval = setInterval(
      () => void refreshFunction(),
      USER_INFO_REFRESH_INTERVAL_MS
    );
  }

  useUserInfoState(
    listener: (userInfo: UserInfo | null) => void
  ): vscode.Disposable {
    listener(this.userInfoState);

    return this.onChangeEventEmitter.event(listener);
  }

  async refresh() {
    const oldUserState = this.userInfoState;
    this.userInfoState = (await getUserInfo()) ?? null;

    if (!isEqual(oldUserState, this.userInfoState)) {
      this.onChangeEventEmitter.fire(this.userInfoState);
    }
  }

  dispose() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

const refresher = new UserInfoStateRefresher();

export function currentUserInfo(): UserInfo | null {
  return refresher.userInfoState;
}

export function useCurrentUserInfo(
  listener: (current: UserInfo | null) => void
): vscode.Disposable {
  return refresher.useUserInfoState(listener);
}

export function startUserInfoStateRefreshInterval(
  context: vscode.ExtensionContext
) {
  refresher.start();

  context.subscriptions.push(refresher);
}
