import { ExtensionContext } from "vscode";
import ChatEnabledState, {
  ChatEnabledStateData,
  ChatStates,
} from "./ChatEnabledState";
import EventEmitterBasedNonNullState from "../state/EventEmitterBasedNonNullState";
import { useDerviedState } from "../state/deriveState";
import BINARY_STATE from "../binary/binaryStateSingleton";
import { State } from "../binary/state";

export default class EvalSaasChatEnabledState
  extends EventEmitterBasedNonNullState<ChatEnabledStateData>
  implements ChatEnabledState {
  constructor(context: ExtensionContext) {
    super(ChatStates.loading);

    context.subscriptions.push(
      useDerviedState(
        BINARY_STATE,
        (state: State) => state.is_logged_in,
        (isLoggedIn) => {
          this.updateState(isLoggedIn);
        }
      )
    );
  }

  private updateState(isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.set(ChatStates.enabled);
    } else {
      this.set(ChatStates.disabled("authnetication_required"));
    }
  }
}
