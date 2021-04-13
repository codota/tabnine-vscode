import { openConfigWithSource } from "../commandsHandler";
import { MessageActions, StateType } from "../globals/consts";

export default async function executeNotificationAction(
  selectedActions: MessageActions[] | undefined
): Promise<void> {
  if (selectedActions?.includes(MessageActions.OPEN_HUB)) {
    return openConfigWithSource(StateType.NOTIFICATION)();
  }
  return Promise.resolve();
}
