import { URLSearchParams } from "url";
import openHub from "../hub/openHub";
import {
  MessageAction,
  MessageActionsEnum,
  NOTIFICATIONS_OPEN_QUERY_PARAM,
  OpenHubWithAction,
  StateType,
} from "../globals/consts";

export default async function executeNotificationAction(
  selectedActions: MessageAction[] | undefined
): Promise<void> {
  if (selectedActions?.includes(MessageActionsEnum.OPEN_HUB)) {
    return openHub(StateType.NOTIFICATION)();
  }

  if (selectedActions?.includes(MessageActionsEnum.OPEN_NOTIFICATIONS_IN_HUB)) {
    return openHub(
      StateType.NOTIFICATION,
      `/home?${NOTIFICATIONS_OPEN_QUERY_PARAM}`
    )();
  }

  const openHubWithActions = selectedActions
    ?.map((action) => action as OpenHubWithAction)
    .filter(
      (action) =>
        action.OpenHubWith &&
        action.OpenHubWith.path &&
        action.OpenHubWith.query_params
    )
    .map(({ OpenHubWith: { path, query_params } }) =>
      openHub(StateType.NOTIFICATION, buildFullHubPath(path, query_params))()
    );

  if (openHubWithActions?.length) {
    return Promise.all(openHubWithActions).then();
  }

  return Promise.resolve();
}

function buildFullHubPath(path: string, params: [string, string][]) {
  return `${path}?${buildQueryParamsString(params)}`;
}

function buildQueryParamsString(params: [string, string][]) {
  return new URLSearchParams(params).toString();
}
