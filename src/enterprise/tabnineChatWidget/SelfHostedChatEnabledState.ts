import { ExtensionContext } from "vscode";
import ChatEnabledState, {
  ChatEnabledStateData,
  ChatStates,
} from "../../tabnineChatWidget/ChatEnabledState";
import EventEmitterBasedNonNullState from "../../state/EventEmitterBasedNonNullState";
import USER_INFO_STATE from "../lifecycle/UserInfoState";
import { UserInfo } from "../requests/UserInfo";

export default class SelfHostedChatEnabledState
  extends EventEmitterBasedNonNullState<ChatEnabledStateData>
  implements ChatEnabledState {
  constructor(context: ExtensionContext) {
    super(ChatStates.loading);

    context.subscriptions.push(
      USER_INFO_STATE.onChange((userInfo) => {
        this.updateState(userInfo);
      })
    );
  }

  updateState(userInfo: UserInfo) {
    const isEnabled = userInfo.team !== null;

    if (isEnabled) {
      this.set(ChatStates.enabled);
    } else if (userInfo.isLoggedIn) {
      this.set(ChatStates.disabled("part_of_a_team_required"));
    } else {
      this.set(ChatStates.disabled("authnetication_required"));
    }
  }
}
