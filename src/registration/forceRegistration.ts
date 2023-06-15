import {
  Capability,
  isCapabilityEnabled,
  isEnabled,
  onDidRefreshCapabilities,
} from "../capabilities/capabilities";
import { StatePoller } from "../state/statePoller";
import * as vscode from "vscode";
import {
  InstallationState,
  InstallationStateEmitter,
} from "../events/installationStateChangedEmitter";
import { Publisher } from "../utils/publisher";
import { PopupTristate } from "./popupTristate";
import { callForLogin } from "../authentication/authentication.api";

const isForceEnabled = new Publisher(isEnabled(Capability.FORCE_REGISTRATION));

export function shouldBlockCompletions(): boolean {
  // if the feature is on and the user isn't logged in we will block the completions
  return (
    isForceEnabled.value === true &&
    !(StatePoller.state.currentState?.is_logged_in ?? false)
  );
}

if (isForceEnabled.value === undefined) {
  const disposable = onDidRefreshCapabilities(() => {
    disposable.dispose();
    // now take the real value since it got retrieved
    isForceEnabled.value = isCapabilityEnabled(Capability.FORCE_REGISTRATION);
  });
}

export function forceRegistrationIfNeeded() {
  if (isForceEnabled.value === true) {
    void forceFlowFSM();
  } else if (isForceEnabled.value === undefined) {
    // wait for value
    const disposable = isForceEnabled.emitter.event((enabled) => {
      // at this point has a real value
      disposable.dispose();
      if (enabled) {
        void forceFlowFSM();
      }
    });
  }
}

async function forceFlowFSM() {
  const popupTristate = new PopupTristate();
  // already have enough data to display
  if (popupTristate.shouldDisplay) {
    void popupState();
  } else if (popupTristate.needWait) {
    const disposable = popupTristate.changedStateEmitter.event(() => {
      if (!popupTristate.needWait) {
        disposable.dispose();
      }
      if (popupTristate.shouldDisplay) {
        popupTristate.displayed();
        void popupState();
      }
    });
  }

  if (
    InstallationStateEmitter.state === InstallationState.ExistingInstallation
  ) {
    if (StatePoller.state.currentState?.is_logged_in === false) {
      void notifyState();
    } else if (!StatePoller.state.currentState) {
      // still waiting for a state message from the binary -
      // in this case we subscribe to the state change
      // delay the notification until we have enough information
      const disposable = StatePoller.event((change) => {
        disposable.dispose();
        if (change.currentState?.is_logged_in === false) {
          void notifyState();
        }
      });
    }
  }
}

async function popupState() {
  const res = await vscode.window.showInformationMessage(
    "Sign in to Tabnine",
    { modal: true },
    "Sign in"
  );
  if (res === "Sign in") {
    void callForLogin();
    // send analytics
  } else {
    // send analytics
    // display notification
    void notifyState();
  }
}

async function notifyState() {
  const res = await vscode.window.showWarningMessage(
    "Sign in to use Tabnine",
    "Sign in"
  );
  if (res === "Sign in") {
    void callForLogin();
  } else {
  }
}
