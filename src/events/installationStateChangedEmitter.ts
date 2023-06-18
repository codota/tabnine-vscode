import { Disposable, Event, EventEmitter } from "vscode";

export enum InstallationState {
  Undefined,
  ExistingInstallation,
  NewInstallation,
}

export class InstallationStateEmitter implements Disposable {
  private emitter = new EventEmitter<InstallationState>();

  private internalState = InstallationState.Undefined;

  private hadNewInstallState?: boolean;

  get state(): InstallationState {
    return this.internalState;
  }

  fire(state: InstallationState) {
    this.internalState = state;
    if (state === InstallationState.NewInstallation) {
      this.hadNewInstallState = true;
    } else if (
      state === InstallationState.ExistingInstallation &&
      !this.hadNewInstallState
    ) {
      this.hadNewInstallState = false;
    }
    this.emitter.fire(state);
  }

  get event(): Event<InstallationState> {
    return this.emitter.event;
  }

  get newInstall(): boolean | undefined {
    // Installation state is set by the binary fetcher based on the binary path.
    // Subsequent launches of the binary within the same session can toggle that state
    // that is a problem when capabilities arriving later on and their flows relying on "new install" state will always fail.
    // We need to keep this history around for this session
    return this.hadNewInstallState;
  }

  dispose() {
    this.emitter.dispose();
  }
}

export const installationState = new InstallationStateEmitter();
