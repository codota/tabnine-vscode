import { ExtensionContext, workspace } from "vscode";
import CommitMessageEnabledState, {
  CommitMessageEnabledStateData,
  CommitMessageStates,
} from "./CommitMessageEnabledState";
import {
  Capability,
  isCapabilitiesReady,
  isCapabilityEnabled,
  onDidRefreshCapabilities,
} from "../capabilities/capabilities";
import EventEmitterBasedNonNullState from "../state/EventEmitterBasedNonNullState";
import { useDerviedState } from "../state/deriveState";
import BINARY_STATE from "../binary/binaryStateSingleton";
import { State } from "../binary/state";
import {
  COMMIT_MESSAGE_ENABLED_SETTING,
  isCommitMessageSettingEnabled,
} from "./commitMessageSettings";

export default class SaasCommitMessageEnabledState
  extends EventEmitterBasedNonNullState<CommitMessageEnabledStateData>
  implements CommitMessageEnabledState {
  constructor(context: ExtensionContext) {
    super(CommitMessageStates.loading);

    this.updateState(BINARY_STATE.get()?.is_logged_in ?? null);

    context.subscriptions.push(
      useDerviedState(
        BINARY_STATE,
        (state: State) => state.is_logged_in,
        (isLoggedIn) => {
          this.updateState(isLoggedIn);
        }
      ),
      onDidRefreshCapabilities(() => {
        this.updateState(BINARY_STATE.get()?.is_logged_in ?? null);
      }),
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(COMMIT_MESSAGE_ENABLED_SETTING)) {
          this.updateState(BINARY_STATE.get()?.is_logged_in ?? null);
        }
      })
    );
  }

  private updateState(isLoggedIn: boolean | null): void {
    if (!isCommitMessageSettingEnabled()) {
      this.set(CommitMessageStates.disabled("disabled_by_setting"));
      return;
    }

    if (!isCapabilitiesReady() || isLoggedIn === null) {
      return;
    }

    if (isCapabilityEnabled(Capability.PREVIEW_ENDED_CAPABILITIY)) {
      this.set(CommitMessageStates.disabled("preview_ended"));
      return;
    }

    if (!isLoggedIn) {
      this.set(CommitMessageStates.disabled("not_logged_in"));
      return;
    }

    if (!hasGenerationCapability()) {
      this.set(CommitMessageStates.disabled("capability_required"));
      return;
    }

    this.set(CommitMessageStates.enabled);
  }
}

function hasGenerationCapability(): boolean {
  return (
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) ||
    isCapabilityEnabled(Capability.TABNINE_COMMIT_MESSAGE) ||
    isCapabilityEnabled(Capability.TABNINE_CHAT) ||
    isCapabilityEnabled(Capability.PREVIEW_CAPABILITIY)
  );
}
