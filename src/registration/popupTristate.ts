// conditions to show the popup
// 1. new installation
// 2. not logged in
// 3. never displayed the popup before

import {
  InstallationState,
  InstallationStateEmitter,
} from "../events/installationStateChangedEmitter";
import { StatePoller } from "../state/statePoller";
import { EventEmitter } from "vscode";

export class PopupTristate {
  installationState = InstallationStateEmitter.state;
  isLoggedIn = StatePoller.state.currentState?.is_logged_in;
  _didDisplay = false;
  changedStateEmitter = new EventEmitter<void>();
  constructor() {
    if (this.installationState === InstallationState.Undefined) {
      const dispose = InstallationStateEmitter.event((e) => {
        if (e !== InstallationState.Undefined) {
          this.installationState = e;
          dispose.dispose();
          this.changedStateEmitter.fire();
        }
      });
    }

    if (!StatePoller.state.currentState) {
      const disposable = StatePoller.event((state) => {
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
      !StatePoller.state.currentState
    );
  }

  get shouldDisplay() {
    return (
      this.installationState === InstallationState.NewInstallation &&
      this.isLoggedIn === false &&
      !this._didDisplay
    );
  }

  displayed() {
    this._didDisplay = true;
  }
}
