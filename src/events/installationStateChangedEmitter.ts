import { Event, EventEmitter } from "vscode";

export enum InstallationState {
  Undefined,
  ExistingInstallation,
  NewInstallation,
}

export class InstallationStateEmitter {
  private static emitter = new EventEmitter<InstallationState>();

  private static internalState = InstallationState.Undefined;

  static get state(): InstallationState {
    return InstallationStateEmitter.internalState;
  }

  static fire(state: InstallationState) {
    InstallationStateEmitter.internalState = state;
    InstallationStateEmitter.emitter.fire(state);
  }

  static get event(): Event<InstallationState> {
    return InstallationStateEmitter.emitter.event;
  }
}
