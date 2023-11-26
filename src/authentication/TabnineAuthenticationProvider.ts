import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  commands,
  Disposable,
  Event,
  EventEmitter,
} from "vscode";
import { once, EventEmitter as Emitter } from "events";
import { State } from "../binary/state";
import { BRAND_NAME } from "../globals/consts";
import { sleep } from "../utils/utils";
import { callForLogin, callForLogout } from "./authentication.api";
import TabnineSession from "./TabnineSession";
import BINARY_STATE from "../binary/binaryStateSingleton";
import { getState } from "../binary/requests/requests";

const LOGIN_HAPPENED_EVENT = "loginHappened";

export default class TabnineAuthenticationProvider
  implements AuthenticationProvider, Disposable {
  public readonly id: string = BRAND_NAME;

  public readonly label: string = BRAND_NAME;

  private initializedDisposable: Disposable | undefined;

  private lastState: State | undefined | null;

  private onDidLogin = new Emitter();

  private myOnDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this.myOnDidChangeSessions.event;
  }

  constructor() {
    this.initializedDisposable = Disposable.from(
      this.handleSessionChange(),
      this.pollState()
    );
  }

  getSessions(): Promise<readonly AuthenticationSession[]> {
    const state = this.lastState;

    return Promise.resolve(
      state?.is_logged_in
        ? [new TabnineSession(state?.user_name, state?.access_token)]
        : []
    );
  }

  async createSession(): Promise<AuthenticationSession> {
    await callForLogin();
    const state = await this.waitForLogin();
    return new TabnineSession(state?.user_name, state?.access_token);
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
        void getState().then((state) => {
          void this.checkForUpdates(state);
        });
      }
    });
  }

  private pollState(): Disposable {
    return BINARY_STATE.useState((state) => {
      void this.checkForUpdates(state);
    });
  }

  private async checkForUpdates(
    state: State | null | undefined
  ): Promise<void> {
    const added: AuthenticationSession[] = [];
    const removed: AuthenticationSession[] = [];

    const { lastState } = this;

    this.lastState = state;

    const newState = this.lastState;
    const oldState = lastState;

    if (newState?.is_logged_in) {
      this.onDidLogin.emit(LOGIN_HAPPENED_EVENT, newState);
    }

    if (newState) {
      await setAuthenticationReady();
    }
    await setAuthenticationState(oldState, newState);

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
async function setAuthenticationState(
  oldState: State | null | undefined,
  newState: State | null | undefined
) {
  return commands.executeCommand(
    "setContext",
    "tabnine.authenticated",
    oldState?.is_logged_in || newState?.is_logged_in
  );
}

async function setAuthenticationReady() {
  return commands.executeCommand(
    "setContext",
    "tabnine.authentication.ready",
    true
  );
}
