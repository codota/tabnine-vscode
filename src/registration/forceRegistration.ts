import * as vscode from "vscode";
import {
  Capability,
  isCapabilityEnabled,
  isEnabled,
  onDidRefreshCapabilities,
} from "../capabilities/capabilities";
import { statePoller } from "../state/statePoller";
import {
  installationState,
  InstallationState,
} from "../events/installationStateChangedEmitter";
import { Publisher } from "../utils/publisher";
import { PopupTristate } from "./popupTristate";
import { callForLogin } from "../authentication/authentication.api";
import { fireEvent } from "../binary/requests/requests";

const isForceEnabled = new Publisher(isEnabled(Capability.FORCE_REGISTRATION));

export function shouldBlockCompletions(): boolean {
  return false;
  // if the feature is on and the user isn't logged in we will block the completions
  // return (
  //   isForceEnabled.value === true &&
  //   !(statePoller.state.currentState?.is_logged_in ?? false)
  // );
}

export function shouldStatusBarBeProminent(): boolean {
  return (
    isForceEnabled.value === true &&
    !(statePoller.state.currentState?.is_logged_in ?? false)
  );
}

if (isForceEnabled.value === undefined) {
  const disposable = onDidRefreshCapabilities(() => {
    isForceEnabled.value = isCapabilityEnabled(Capability.FORCE_REGISTRATION);
    if (isForceEnabled.value) {
      disposable.dispose();
    }
  });
}

export function forceRegistrationIfNeeded() {
  if (isForceEnabled.value === true) {
    void forceFlowFSM();
  } else {
    // wait for value
    const disposable = isForceEnabled.emitter.event((enabled) => {
      if (enabled) {
        disposable.dispose();
        void forceFlowFSM();
      }
    });
  }
}

function forceFlowFSM() {
  awaitLoginNotification();
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

  if (installationState.state === InstallationState.ExistingInstallation) {
    if (statePoller.state.currentState?.is_logged_in === false) {
      void notifyState();
    } else if (!statePoller.state.currentState) {
      // still waiting for a state message from the binary -
      // in this case we subscribe to the state change
      // delay the notification until we have enough information
      const disposable = statePoller.event((change) => {
        if (change.currentState?.is_logged_in === false) {
          disposable.dispose();
          void notifyState();
        }
      });
    }
  }
}

async function popupState() {
  void fireEvent({ name: "force-registration-popup-displayed" });
  const res = await vscode.window.showInformationMessage(
    "Please sign in to start using Tabnine",
    { modal: true },
    "Sign in"
  );
  if (res === "Sign in") {
    void fireEvent({ name: "force-registration-popup-signin-clicked" });
    void callForLogin();
    // send analytics
  } else {
    void fireEvent({ name: "force-registration-popup-dismissed" });
    void notifyState();
  }
}

async function notifyState() {
  void fireEvent({ name: "force-registration-notification-displayed" });
  const res = await vscode.window.showWarningMessage(
    "Please sign in to start using Tabnine",
    "Sign in"
  );
  if (res === "Sign in") {
    void fireEvent({ name: "force-registration-notification-signin-clicked" });
    void callForLogin();
  } else {
    void fireEvent({ name: "force-registration-notification-dismissed" });
  }
}

function awaitLoginNotification() {
  if (statePoller.state.currentState?.is_logged_in) {
    void fireEvent({ name: "force-registration-login-success-displayed" });
    void vscode.window.showInformationMessage(
      `You are currently logged in as ${statePoller.state.currentState.user_name}`,
      "ok"
    );
  } else {
    const disposable = statePoller.event((change) => {
      if (change.currentState?.is_logged_in) {
        disposable.dispose();
        void fireEvent({ name: "force-registration-login-success-displayed" });
        void vscode.window.showInformationMessage(
          `You are currently logged in as ${change.currentState.user_name}`,
          "ok"
        );
      }
    });
  }
}
