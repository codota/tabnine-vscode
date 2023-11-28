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
import { once as runOnce } from "underscore";
import { State } from "../binary/state";
import { BRAND_NAME } from "../globals/consts";
import { sleep } from "../utils/utils";
import { callForLogin, callForLogout } from "./authentication.api";
import TabnineSession from "./TabnineSession";
import BINARY_STATE from "../binary/binaryStateSingleton";
import { deriveNonNullState } from "../utils/deriveState";

const LOGIN_HAPPENED_EVENT = "loginHappened";

type UserAuthData = {
  username: string;
  accessToken: string;
};

type AuthStateData = {
  current: UserAuthData | null;
  last: UserAuthData | null;
};

const AUTH_INITIAL_STATE = {
  last: null,
  current: null,
};

function toSession({ accessToken, username }: UserAuthData): TabnineSession {
  return new TabnineSession(username, accessToken);
}

const setAuthenticationReadyOnce = runOnce(setAuthenticationReady);

export default class TabnineAuthenticationProvider
  implements AuthenticationProvider, Disposable {
  public readonly id: string = BRAND_NAME;

  public readonly label: string = BRAND_NAME;

  private initializedDisposable: Disposable | undefined;

  private onDidLogin = new Emitter();

  private sessionsChangeEventEmitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  private authState = deriveNonNullState(
    BINARY_STATE,
    calculateAuthState,
    AUTH_INITIAL_STATE
  );

  constructor() {
    this.initializedDisposable = Disposable.from(
      this.authState,
      this.onDerivedAuthStateChanged(),
      listenForSessionChangeFromVscode()
    );
  }

  get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this.sessionsChangeEventEmitter.event;
  }

  getSessions(): Promise<readonly AuthenticationSession[]> {
    const userData = this.authState.get().current;

    return Promise.resolve(userData ? [toSession(userData)] : []);
  }

  async createSession(): Promise<AuthenticationSession> {
    await callForLogin();
    const userAuth = await this.waitForLogin();

    return toSession(userAuth);
  }

  private async waitForLogin(): Promise<UserAuthData> {
    return ((await once(this.onDidLogin, LOGIN_HAPPENED_EVENT)) as [
      UserAuthData
    ])[0];
  }

  // eslint-disable-next-line class-methods-use-this
  async removeSession(): Promise<void> {
    await callForLogout();

    await sleep(5000);
  }

  dispose(): void {
    this.initializedDisposable?.dispose();
  }

  private onDerivedAuthStateChanged(): Disposable {
    return this.authState.onChange(async ({ current, last }) => {
      await setAuthenticationReadyOnce();

      if (current && !last) {
        this.onDidLogin.emit(LOGIN_HAPPENED_EVENT, current);
      }

      if (!current) {
        await clearSessionPreference();
      }

      await setAuthenticationState(Boolean(current));
      this.notifyVscodeOfAuthStateChanges(current, last);
    });
  }

  private notifyVscodeOfAuthStateChanges(
    current: UserAuthData | null,
    last: UserAuthData | null
  ) {
    if (!last && current) {
      this.sessionsChangeEventEmitter.fire({
        added: [toSession(current)],
      });
    }

    if (last && !current) {
      this.sessionsChangeEventEmitter.fire({
        removed: [toSession(last)],
      });
    }

    if (last && current) {
      this.sessionsChangeEventEmitter.fire({
        removed: [toSession(last)],
        added: [toSession(current)],
      });
    }
  }
}

async function clearSessionPreference() {
  await authentication.getSession(BRAND_NAME, [], {
    clearSessionPreference: true,
  });
}

function listenForSessionChangeFromVscode(): Disposable {
  // This fires when the user initiates a "silent" auth flow via the Accounts menu.
  return authentication.onDidChangeSessions((e) => {
    if (e.provider.id === BRAND_NAME) {
      void BINARY_STATE.checkForUpdates();
    }
  });
}

function calculateAuthState(binartState: State, value: AuthStateData) {
  const newValue: AuthStateData = {
    last: value.current,
    current: null,
  };

  if (binartState.is_logged_in) {
    newValue.current = {
      accessToken: binartState.access_token || "",
      username: binartState.user_name,
    };
  }

  return newValue;
}

async function setAuthenticationState(authenticated: boolean) {
  return commands.executeCommand(
    "setContext",
    "tabnine.authenticated",
    authenticated
  );
}

async function setAuthenticationReady() {
  return commands.executeCommand(
    "setContext",
    "tabnine.authentication.ready",
    true
  );
}
