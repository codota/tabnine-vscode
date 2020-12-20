
import { openConfigWithSource } from "../commandsHandler";
import { MessageActions, StateType } from "../consts";

export default async function executeNotificationAction(
  selectedAction: MessageActions | undefined
): Promise<void> {

  switch (selectedAction) {
    case MessageActions.OPEN_HUB:
      return openConfigWithSource(StateType.NOTIFICATION)();
    case MessageActions.NONE:
    default:
      // Nothing to do. It is either unrecognized or undefined, and for both we do nothing.
      return Promise.resolve();
  }
}
