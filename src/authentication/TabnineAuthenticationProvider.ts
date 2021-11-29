import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  Event,
  EventEmitter,
} from "vscode";
import { once, EventEmitter as Emitter } from "events";
import { getState } from "../binary/requests/requests";
import { State } from "../binary/state";
import { BRAND_NAME } from "../globals/consts";
import { sleep } from "../utils/utils";
import { callForLogin, callForLogout } from "./authentication.api";

import TabnineSession from "./TabnineSession";

const SESSION_POLL_INTERVAL = 10000;
const LOGIN_HAPPENED_EVENT = "loginHappened";

export default class TabnineAuthenticationProvider
  implements AuthenticationProvider, Disposable {
  public readonly id: string = BRAND_NAME;

  public readonly label: string = BRAND_NAME;

  private initializedDisposable: Disposable | undefined;

  private lastState: Promise<State | undefined | null> | undefined;

  private onDidLogin = new Emitter();

  private myOnDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this.myOnDidChangeSessions.event;
  }

  constructor() {
    this.myOnDidChangeSessions.event((data) => {
      if (data.removed && data.removed.length > 0) {
        void authentication.getSession(BRAND_NAME, [], { createIfNone: false });
      }
    });
    this.initializedDisposable = Disposable.from(
      this.handleSessionChange(),
      this.pollState()
    );
  }

  async getSessions(): Promise<readonly AuthenticationSession[]> {
    const state = await this.lastState;

    return state?.is_logged_in ? [new TabnineSession(state?.user_name)] : [];
  }

  async createSession(): Promise<AuthenticationSession> {
    await callForLogin();
    const state = await this.waitForLogin();
    return new TabnineSession(state?.user_name);
  }

  async removeSession(): Promise<void> {
    await callForLogout();

    this.myOnDidChangeSessions.fire({
      removed: [(await this.getSessions())[0]],
    });
    await sleep(5000);
  }

  dispose(): void {
    this.initializedDisposable?.dispose();
  }

  private async waitForLogin(): Promise<State> {
    return ((await once(this.onDidLogin, LOGIN_HAPPENED_EVENT)) as [State])[0];
  }

  private handleSessionChange(): Disposable {
    // This fires when the user initiates a "silent" auth flow via the Accounts menu.
    return authentication.onDidChangeSessions((e) => {
      if (e.provider.id === BRAND_NAME) {
        void this.checkForUpdates();
      }
    });
  }

  private pollState(): Disposable {
    void this.checkForUpdates();
    const interval = setInterval(() => {
      void this.checkForUpdates();
    }, SESSION_POLL_INTERVAL);
    return new Disposable(() => {
      clearInterval(interval);
    });
  }

  private async checkForUpdates(): Promise<void> {
    const added: AuthenticationSession[] = [];
    const removed: AuthenticationSession[] = [];

    const state = getState();
    const { lastState } = this;

    this.lastState = state;

    const newState = await this.lastState;
    const oldState = await lastState;

    if (newState?.is_logged_in) {
      this.onDidLogin.emit(LOGIN_HAPPENED_EVENT, newState);
    }

    if (!oldState?.is_logged_in && newState?.is_logged_in) {
      added.push((await this.getSessions())[0]);
    } else if (newState && !newState.is_logged_in && oldState?.is_logged_in) {
      removed.push((await this.getSessions())[0]);
    } else {
      return;
    }

    this.myOnDidChangeSessions.fire({
      added,
      removed,
    });
  }
}
