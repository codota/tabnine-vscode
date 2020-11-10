import * as TypeMoq from "typemoq";
import { readLineMock, stdinMock } from "../../../binary/mockedRunProcess";
import { Notification } from "../../../binary/requests/notifications";
import { BinaryGenericRequest } from "./helper";

export type NotificationRequest = BinaryGenericRequest<{
  Notifications: Record<string, unknown>;
}>;

// eslint-disable-next-line import/prefer-default-export
export function setNotificationsResult(...notifications: Notification[]): void {
  let requestHappened: boolean | null = null;

  stdinMock.setup((x) =>
    x.write(
      TypeMoq.It.is<string>((request) => {
        const completionRequest = JSON.parse(request) as NotificationRequest;

        // TODO: match exact request
        if (
          !!completionRequest?.request?.Notifications &&
          requestHappened === null
        ) {
          requestHappened = true;

          return true;
        }

        return false;
      }),
      "utf8"
    )
  );
  readLineMock
    .setup((x) => x.once("line", TypeMoq.It.isAny()))
    .callback((x, callback: (line: string) => void) => {
      if (!requestHappened) {
        callback("null");
      } else {
        callback(JSON.stringify({ notifications }));
        requestHappened = false;
      }
    });
}
