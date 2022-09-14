import openHub from "../hub/openHub";
import {
  MessageActions,
  NOTIFICATIONS_OPEN_QUERY_PARAM,
  StateType,
} from "../globals/consts";

export default async function executeNotificationAction(
  selectedActions: MessageActions[] | undefined
): Promise<void> {
  if (selectedActions?.includes(MessageActions.OPEN_HUB)) {
    return openHub(StateType.NOTIFICATION)();
  }

  if (selectedActions?.includes(MessageActions.OPEN_NOTIFICATIONS_IN_HUB)) {
    return openHub(
      StateType.NOTIFICATION,
      `/home?${NOTIFICATIONS_OPEN_QUERY_PARAM}`
    )();
  }

  return Promise.resolve();
}
