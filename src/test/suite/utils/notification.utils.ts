import * as TypeMoq from "typemoq";
import { readLineMock, stdinMock } from "../../../binary/mockedRunProcess";
import { Notifications } from "../../../binary/requests/notifications";
import { BinaryGenericRequest } from "./helper";

export type NotificationRequest = BinaryGenericRequest<{
  Notifications: Record<string, unknown>;
}>;

// eslint-disable-next-line import/prefer-default-export
export function setNotificationsResult(
  ...notifications: Notifications[]
): void {
  let requestHappened = 0;
  let requestAnswered = 0;

  stdinMock.setup((x) =>
    x.write(
      TypeMoq.It.is<string>((request) => {
        const completionRequest = JSON.parse(request) as NotificationRequest;

        // TODO: match exact request
        if (completionRequest?.request?.Notifications) {
          requestHappened += 1;

          return true;
        }

        return false;
      }),
      "utf8"
    )
  );
  readLineMock
    .setup((x) => x.on("line", TypeMoq.It.isAny()))
    .callback((_x, callback: (line: string) => void) => {
      if (requestHappened === requestAnswered) {
        callback("null");
      } else {
        callback(JSON.stringify(notifications[requestAnswered] || null));
        requestAnswered += 1;
      }
    });
}
