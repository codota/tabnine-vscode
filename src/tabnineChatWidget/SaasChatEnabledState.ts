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
import EventEmitterBasedNonNullState from "../utils/EventEmitterBasedNonNullState";

export default class SaasChatEnabledState
  extends EventEmitterBasedNonNullState<ChatEnabledStateData>
  implements ChatEnabledState {
  constructor(context: ExtensionContext) {
    super(ChatStates.loading);

    this.updateState();

    context.subscriptions.push(
      onDidRefreshCapabilities(() => {
        this.updateState();
      })
    );
  }

  updateState() {
    if (!isCapabilitiesReady()) {
      return;
    }

    const isCapabilitesEnabled = getIsCapabilitesEnabled();
    const newEnabled = isCapabilitesEnabled
      ? ChatStates.enabled
      : ChatStates.disabled("capability_required");

    this.set(newEnabled);
  }
}

function getIsCapabilitesEnabled() {
  return (
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) ||
    isCapabilityEnabled(Capability.TABNINE_CHAT)
  );
}
