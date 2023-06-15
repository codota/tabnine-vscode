// conditions to show the popup
// 1. new installation
// 2. not logged in
// 3. never displayed the popup before

import { EventEmitter } from "vscode";
import {
  InstallationState,
  installationStateEmitter,
} from "../events/installationStateChangedEmitter";
import { StatePoller } from "../state/statePoller";

export class PopupTristate {
  installationState = installationStateEmitter.state;

  isLoggedIn: boolean | undefined;

  didDisplay = false;

  changedStateEmitter = new EventEmitter<void>();

  constructor(private statePoller: StatePoller) {
    this.isLoggedIn = statePoller.state.currentState?.is_logged_in;
    if (this.installationState === InstallationState.Undefined) {
      const dispose = installationStateEmitter.event((e) => {
        if (e !== InstallationState.Undefined) {
          this.installationState = e;
          dispose.dispose();
          this.changedStateEmitter.fire();
        }
      });
    }

    if (!this.statePoller.state.currentState) {
      const disposable = statePoller.event((state) => {
        if (state.currentState) {
          disposable.dispose();
          this.isLoggedIn = state.currentState.is_logged_in;
          this.changedStateEmitter.fire();
        }
      });
    }
  }

  get needWait(): boolean {
    return (
      this.installationState === InstallationState.Undefined ||
      !this.statePoller.state.currentState
    );
  }

  get shouldDisplay() {
    return (
      this.installationState === InstallationState.NewInstallation &&
      this.isLoggedIn === false &&
      !this.didDisplay
    );
  }

  displayed() {
    this.didDisplay = true;
  }
}
