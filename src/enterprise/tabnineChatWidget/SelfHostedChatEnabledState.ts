import { ExtensionContext } from "vscode";
import ChatEnabledState, {
  ChatEnabledStateData,
  ChatStates,
} from "../../tabnineChatWidget/ChatEnabledState";
import EventEmitterBasedNonNullState from "../../state/EventEmitterBasedNonNullState";
import getUserInfo from "../requests/UserInfo";
import { useDerviedState } from "../../state/deriveState";
import BINARY_STATE from "../../binary/binaryStateSingleton";

export default class SelfHostedChatEnabledState
  extends EventEmitterBasedNonNullState<ChatEnabledStateData>
  implements ChatEnabledState {
  constructor(context: ExtensionContext) {
    super(ChatStates.loading);

    context.subscriptions.push(
      useDerviedState(
        BINARY_STATE,
        (state) => state.is_logged_in,
        () => {
          void this.updateState();
        }
      )
    );
  }

  async updateState() {
    await this.asyncSet(fetchChatState);
  }
}

async function fetchChatState(): Promise<ChatEnabledStateData | null> {
  const userInfo = await getUserInfo();

  if (!userInfo) {
    return null;
  }

  const isEnabled = userInfo.team !== null;

  if (isEnabled) {
    return ChatStates.enabled;
  }

  if (userInfo.isLoggedIn) {
    return ChatStates.disabled("part_of_a_team_required");
  }

  return ChatStates.disabled("authnetication_required");
}
