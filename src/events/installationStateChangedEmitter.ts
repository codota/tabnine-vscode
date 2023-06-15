import { Disposable, Event, EventEmitter } from "vscode";

export enum InstallationState {
  Undefined,
  ExistingInstallation,
  NewInstallation,
}

export class InstallationStateEmitter implements Disposable {
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

  dispose() {
    this.emitter.dispose();
  }
}

export const installationState = new InstallationStateEmitter();
