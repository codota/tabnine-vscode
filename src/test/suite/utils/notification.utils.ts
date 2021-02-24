import { requestResponseItems } from "../../../binary/mockedRunProcess";
import { Notifications } from "../../../binary/requests/notifications";
import { BinaryGenericRequest } from "./helper";

export type NotificationRequest = BinaryGenericRequest<{
  Notifications: Record<string, unknown>;
}>;

// eslint-disable-next-line import/prefer-default-export
export function setNotificationsResult(
  ...notifications: Notifications[]
): void {
  let counter = 0;
  let response: Notifications | undefined;

  requestResponseItems.push({
    isQualified: (request) => {
      const completionRequest = JSON.parse(request) as NotificationRequest;

      if (completionRequest?.request?.Notifications) {
        response = notifications[counter];
        counter += 1;

        return true;
      }

      return false;
    },
    result: () => response || null,
  });
}
