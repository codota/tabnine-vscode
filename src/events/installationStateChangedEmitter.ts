import { Event, EventEmitter } from "vscode";

export enum InstallationState {
  Undefined,
  ExistingInstallation,
  NewInstallation,
}

class InstallationStateEmitter {
  private emitter = new EventEmitter<InstallationState>();

  private internalState = InstallationState.Undefined;

  get state(): InstallationState {
    return this.internalState;
  }

  fire(state: InstallationState) {
    this.internalState = state;
    this.emitter.fire(state);
  }

  get event(): Event<InstallationState> {
    return this.emitter.event;
  }
}

export const installationStateEmitter = new InstallationStateEmitter();
