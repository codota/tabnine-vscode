import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  Event,
  EventEmitter,
} from "vscode";
import { getState } from "../binary/requests/requests";
import { BRAND_NAME } from "../globals/consts";
import { sleep } from "../utils/utils";
import { callForLogin, callForLogout } from "./authentication.api";

import TabnineSession from "./TabnineSession";

const SESSION_POLL_INTERVAL = 10000;

export default class TabnineAuthenticationProvider
  implements AuthenticationProvider, Disposable {
  public readonly id: string = "tabnine";

  public readonly label: string = "Tabnine";

  private initializedDisposable: Disposable | undefined;

  private currentSession: AuthenticationSession | undefined;

  private myOnDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this.myOnDidChangeSessions.event;
  }

  async getSessions(): Promise<readonly AuthenticationSession[]> {
    this.ensureInitialized();
    const state = await getState();

    if (state === null || state?.is_logged_in === undefined) {
      return Promise.reject(new Error("No session"));
    }

    return state?.is_logged_in ? [new TabnineSession(state?.user_name)] : [];
  }

  async createSession(): Promise<AuthenticationSession> {
    this.ensureInitialized();
    await callForLogin();
    return new TabnineSession();
  }

  async removeSession(): Promise<void> {
    await callForLogout();
    this.checkForUpdates([]);
    await sleep(5000);
    await authentication.getSession(BRAND_NAME, [], { createIfNone: false });
  }

  dispose(): void {
    this.initializedDisposable?.dispose();
  }

  private ensureInitialized(): void {
    if (this.initializedDisposable === undefined) {
      this.initializedDisposable = Disposable.from(
        this.handleSessionChange(),
        this.pollSessions()
      );
    }
  }

  private handleSessionChange(): Disposable {
    // This fires when the user initiates a "silent" auth flow via the Accounts menu.
    return authentication.onDidChangeSessions(async (e) => {
      if (e.provider.id === BRAND_NAME) {
        const sessions = await this.getSessions();
        void this.checkForUpdates(sessions);
      }
    });
  }

  private pollSessions(): Disposable {
    const interval = setInterval(() => {
      void this.getSessions().then((sessions) => {
        this.checkForUpdates(sessions);
      });
    }, SESSION_POLL_INTERVAL);
    return new Disposable(() => {
      clearInterval(interval);
    });
  }

  private checkForUpdates(session: readonly AuthenticationSession[]): void {
    const added: AuthenticationSession[] = [];
    const removed: AuthenticationSession[] = [];
    const hasSession = session.length > 0;

    if (hasSession && !this.currentSession) {
      added.push(session[0]);
    } else if (!hasSession && this.currentSession) {
      removed.push(this.currentSession);
    } else {
      return;
    }
    this.currentSession = hasSession ? session[0] : undefined;

    this.myOnDidChangeSessions.fire({
      added,
      removed,
    });
  }
}
