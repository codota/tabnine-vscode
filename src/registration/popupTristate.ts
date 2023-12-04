// conditions to show the popup
// 1. new installation
// 2. not logged in
// 3. never displayed the popup before

import { Disposable, EventEmitter } from "vscode";
import { installationState } from "../events/installationStateChangedEmitter";
import BINARY_STATE from "../binary/binaryStateSingleton";

export class PopupTristate implements Disposable {
  private newInstall = installationState.newInstall;

  private isLoggedIn = BINARY_STATE.get()?.is_logged_in;

  private didDisplay = false;

  changedStateEmitter = new EventEmitter<void>();

  constructor() {
    if (this.newInstall === undefined) {
      const dispose = installationState.event(() => {
        if (installationState.newInstall) {
          this.newInstall = true;
          dispose.dispose();
          this.changedStateEmitter.fire();
        }
      });
    }

    const currentState = BINARY_STATE.get();

    if (!currentState) {
      const disposable = BINARY_STATE.onChange((state) => {
        if (state.is_logged_in === false) {
          disposable.dispose();
          this.isLoggedIn = false;
          this.changedStateEmitter.fire();
        }
      });
    }
  }

  get needWait(): boolean {
    return this.newInstall === undefined || this.isLoggedIn === undefined;
  }

  get shouldDisplay() {
    return this.newInstall && this.isLoggedIn === false && !this.didDisplay;
  }

  displayed() {
    this.didDisplay = true;
  }

  dispose() {
    this.changedStateEmitter.dispose();
  }
}
