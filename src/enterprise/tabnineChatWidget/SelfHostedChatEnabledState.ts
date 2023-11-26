import { ExtensionContext, authentication } from "vscode";
import { Mutex } from "await-semaphore";
import ChatEnabledState, {
  ChatEnabledStateData,
  ChatStates,
} from "../../tabnineChatWidget/ChatEnabledState";
import EventEmitterBasedNonNullState from "../../utils/EventEmitterBasedNonNullState";
import getUserInfo from "../requests/UserInfo";

export default class SelfHostedChatEnabledState
  extends EventEmitterBasedNonNullState<ChatEnabledStateData>
  implements ChatEnabledState {
  updateStateLock = new Mutex();

  constructor(context: ExtensionContext) {
    super(ChatStates.loading);

    void this.updateState();

    context.subscriptions.push(
      authentication.onDidChangeSessions(() => {
        void this.updateState();
      })
    );
  }

  async updateState() {
    await this.updateStateLock.use(async () => {
      const userInfo = await getUserInfo();

      if (!userInfo) {
        return;
      }

      const isEnabled = userInfo.team !== null;

      if (isEnabled) {
        this.set(ChatStates.enabled);
      } else if (!userInfo.isLoggedIn) {
        this.set(ChatStates.disabled("authnetication_required"));
      } else {
        this.set(ChatStates.disabled("part_of_a_team_required"));
      }
    });
  }
}
