import { Disposable } from "vscode";
import EventEmitterBasedState from "../../state/EventEmitterBasedState";
import getUserInfo, { UserInfo } from "../requests/UserInfo";
import { useDerviedState } from "../../state/deriveState";
import BINARY_STATE from "../../binary/binaryStateSingleton";

class UserInfoState extends EventEmitterBasedState<UserInfo> {
  toDispose: Disposable;

  constructor() {
    super();

    this.toDispose = useDerviedState(
      BINARY_STATE,
      (s) => s.is_logged_in,
      () => {
        void this.asyncSet(fetchUserState);
      }
    );
  }

  dispose(): void {
    super.dispose();
    this.toDispose.dispose();
  }
}

async function fetchUserState(): Promise<UserInfo | null> {
  return (await getUserInfo()) ?? null;
}

const USER_INFO_STATE = new UserInfoState();
export default USER_INFO_STATE;
