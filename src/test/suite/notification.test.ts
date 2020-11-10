// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as TypeMoq from "typemoq";
import { afterEach } from "mocha";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as assert from "assert";
import { sleep } from "../../utils";
import {
  readLineMock,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { NotificationActions } from "../../binary/requests/notifications";
import {
  A_MESSAGE,
  A_NOTIFICATION_ID,
  AN_OPTION_KEY,
  ANOTHER_MESSAGE,
  ANOTHER_NOTIFICATION_ID,
  ANOTHER_OPTION_KEY,
} from "./utils/testData";
import { setNotificationsResult } from "./utils/notification.utils";
import { BINARY_NOTIFICATION_POLLING_INTERVAL } from "../../consts";
import { SOME_MORE_TIME } from "./utils/helper";

suite("Should poll notifications", () => {
  afterEach(() => {
    stdinMock.reset();
    stdoutMock.reset();
    readLineMock.reset();
  });

  test("Passes the correct request to binary process for notifications", async () => {
    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME); // Wait for server activation
    stdinMock.verify(
      (x) =>
        x.write('{"version":"2.0.2","request":{"Notifications":{}}}\n', "utf8"),
      TypeMoq.Times.atLeastOnce()
    );
  });

  test("Shows a returned notification", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonSpy<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.spy(vscode.window, "showInformationMessage");

    setNotificationsResult({
      id: A_NOTIFICATION_ID,
      message: A_MESSAGE,
      options: [
        { action: NotificationActions.NONE, key: AN_OPTION_KEY },
        {
          action: NotificationActions.NONE,
          key: ANOTHER_OPTION_KEY,
        },
      ],
    });

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME); // Wait for server activation

    assert(
      showInformationMessage.calledWithExactly(
        A_MESSAGE,
        AN_OPTION_KEY,
        ANOTHER_OPTION_KEY
      ),
      "Notification should show"
    );
    showInformationMessage.restore();
  });

  test("Trigger a correct NotificationAction after a user action", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonStub<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.stub(vscode.window, "showInformationMessage");

    showInformationMessage
      .onFirstCall()
      .resolves(AN_OPTION_KEY)
      .onSecondCall()
      .resolves();
    setNotificationsResult(
      {
        id: A_NOTIFICATION_ID,
        message: A_MESSAGE,
        options: [
          { action: NotificationActions.NONE, key: AN_OPTION_KEY },
          {
            action: NotificationActions.NONE,
            key: ANOTHER_OPTION_KEY,
          },
        ],
      },
      {
        id: ANOTHER_NOTIFICATION_ID,
        message: ANOTHER_MESSAGE,
        options: [{ action: NotificationActions.NONE, key: AN_OPTION_KEY }],
      }
    );

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME); // Wait for server activation

    stdinMock.verify(
      (x) =>
        x.write(
          '{"version":"2.0.2","request":{"NotificationAction":{"id":"A_NOTIFICATION_ID","selected":"AN_OPTION_KEY"}}}\n',
          "utf8"
        ),
      TypeMoq.Times.once()
    );
    stdinMock.verify(
      (x) =>
        x.write(
          '{"version":"2.0.2","request":{"NotificationAction":{"id":"ANOTHER_NOTIFICATION_ID"}}}\n',
          "utf8"
        ),
      TypeMoq.Times.once()
    );
    showInformationMessage.restore();
  });
});
