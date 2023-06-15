// conditions to show the popup
// 1. new installation
// 2. not logged in
// 3. never displayed the popup before

import { EventEmitter } from "vscode";
import {
  InstallationState,
  InstallationStateEmitter,
} from "../events/installationStateChangedEmitter";
import { statePoller } from "../state/statePoller";

export class PopupTristate {
  private installationState = InstallationStateEmitter.state;

  private isLoggedIn = statePoller.state.currentState?.is_logged_in;

  private didDisplay = false;

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

    if (!statePoller.state.currentState) {
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
      !statePoller.state.currentState
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
