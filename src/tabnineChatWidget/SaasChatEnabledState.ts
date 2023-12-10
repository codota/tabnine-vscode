import { ExtensionContext } from "vscode";
import ChatEnabledState, {
  ChatEnabledStateData,
  ChatStates,
} from "./ChatEnabledState";
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

export default class SaasChatEnabledState
  extends EventEmitterBasedNonNullState<ChatEnabledStateData>
  implements ChatEnabledState {
  constructor(context: ExtensionContext) {
    super(ChatStates.loading);

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
      })
    );
  }

  private updateState(isLoggedIn: boolean | null) {
    if (!isCapabilitiesReady() || isLoggedIn === null) {
      return;
    }

    if (isLoggedIn && getIsCapabilitesEnabled()) {
      this.set(ChatStates.enabled);
    } else if (isPreviewEnded()) {
      this.set(ChatStates.disabled("preview_ended"));
    } else if (isLoggedIn) {
      this.set(ChatStates.disabled("capability_required"));
    } else {
      this.set(ChatStates.disabled("authnetication_required"));
    }
  }
}

function getIsCapabilitesEnabled() {
  return (
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) ||
    isCapabilityEnabled(Capability.TABNINE_CHAT) ||
    isCapabilityEnabled(Capability.PREVIEW_CAPABILITIY)
  );
}

function isPreviewEnded(): boolean {
  return isCapabilityEnabled(Capability.PREVIEW_ENDED_CAPABILITIY);
}
