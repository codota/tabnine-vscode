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
    console.log("!!! OFEK!!! init SaasChatEnabledState");
    super(ChatStates.loading);

    this.updateState(BINARY_STATE.get()?.is_logged_in || false);

    context.subscriptions.push(
      useDerviedState(
        BINARY_STATE,
        (state: State) => state.is_logged_in,
        (isLoggedIn) => {
          this.updateState(isLoggedIn);
        }
      ),
      onDidRefreshCapabilities(() => {
        this.updateState(BINARY_STATE.get()?.is_logged_in || false);
      })
    );
  }

  private updateState(isLoggedIn: boolean) {
    console.log("!!! OFEK !!! update State");
    if (!isCapabilitiesReady()) {
      console.log("!!! OFEK!!! capabilities not ready");
      return;
    }

    if (getIsCapabilitesEnabled()) {
      console.log("!!! OFEK!!! capabilities enabled");
      this.set(ChatStates.enabled);
    } else if (isLoggedIn) {
      console.log("!!! OFEK!!! capability required");
      this.set(ChatStates.disabled("capability_required"));
    } else {
      console.log("!!! OFEK!!! auth required");
      this.set(ChatStates.disabled("authnetication_required"));
    }
  }
}

function getIsCapabilitesEnabled() {
  return (
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) ||
    isCapabilityEnabled(Capability.TABNINE_CHAT)
  );
}
