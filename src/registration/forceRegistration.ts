import * as vscode from "vscode";
import {
  Capability,
  isCapabilityEnabled,
  onDidRefreshCapabilities,
} from "../capabilities/capabilities";
import {
  InstallationState,
  installationStateEmitter,
} from "../events/installationStateChangedEmitter";
import { Publisher } from "../utils/publisher";
import { PopupTristate } from "./popupTristate";
import { callForLogin } from "../authentication/authentication.api";
import { StatePoller } from "../state/statePoller";

const isForceEnabled = new Publisher(
  isCapabilityEnabled(Capability.FORCE_REGISTRATION)
);
let statePoller: StatePoller | undefined;

export function shouldBlockCompletions(): boolean {
  // if the feature is on and the user isn't logged in we will block the completions
  return (
    isForceEnabled.value === true &&
    !(statePoller?.state.currentState?.is_logged_in ?? false)
  );
}

if (isForceEnabled.value === undefined) {
  const disposable = onDidRefreshCapabilities(() => {
    disposable.dispose();
    // now take the real value since it got retrieved
    isForceEnabled.value = isCapabilityEnabled(Capability.FORCE_REGISTRATION);
  });
}

export function forceRegistrationIfNeeded(poller: StatePoller) {
  statePoller = poller;
  if (isForceEnabled.value === true) {
    void forceFlowFSM(poller);
  } else if (isForceEnabled.value === undefined) {
    // wait for value
    const disposable = isForceEnabled.emitter.event((enabled) => {
      // at this point has a real value
      disposable.dispose();
      if (enabled) {
        void forceFlowFSM(poller);
      }
    });
  }
}

function forceFlowFSM(poller: StatePoller) {
  const popupTristate = new PopupTristate(poller);
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
    installationStateEmitter.state === InstallationState.ExistingInstallation
  ) {
    if (statePoller?.state.currentState?.is_logged_in === false) {
      void notifyState();
    } else if (!statePoller?.state.currentState) {
      // still waiting for a state message from the binary -
      // in this case we subscribe to the state change
      // delay the notification until we have enough information
      const disposable = statePoller?.event((change) => {
        disposable?.dispose();
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
  }
}
