import * as assert from "assert";
import { afterEach, beforeEach } from "mocha";
import * as sinon from "sinon";
import { reset, verify } from "ts-mockito";
import * as vscode from "vscode";
import {
  isProcessReadyForTest,
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { resetBinaryForTesting } from "../../binary/requests/requests";
import {
  BINARY_NOTIFICATION_POLLING_INTERVAL,
  MessageActions,
} from "../../consts";
import { sleep } from "../../utils";
import { SOME_MORE_TIME } from "./utils/helper";
import { setNotificationsResult } from "./utils/notification.utils";
import {
  ANOTHER_MESSAGE,
  ANOTHER_NOTIFICATION_ACTION_HAPPENED,
  ANOTHER_NOTIFICATION_ID,
  ANOTHER_OPTION_KEY,
  AN_OPTION_KEY,
  A_MESSAGE,
  A_NOTIFICATION_ID,
  DIFFERENT_NOTIFICATION_ACTION_HAPPENED,
  DIFFERENT_NOTIFICATION_ID,
  NOTIFICATIONS_REQUEST,
  PROMO_TYPE,
  SAME_NOTIFICATION_ID,
} from "./utils/testData";

suite("Should poll notifications", () => {
  afterEach(() => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    requestResponseItems.length = 0;
    resetBinaryForTesting();
    sinon.verifyAndRestore();
  });

  beforeEach(async () => {
    await isProcessReadyForTest();
  });

  test("Passes the correct request to binary process for notifications", async () => {
    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME);

    verify(stdinMock.write(NOTIFICATIONS_REQUEST, "utf8")).atLeast(1);
  });

  test("Shows a returned notification", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonSpy<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.spy(vscode.window, "showInformationMessage");

    setNotificationsResult({
      notifications: [
        {
          id: A_NOTIFICATION_ID,
          message: A_MESSAGE,
          options: [
            { actions: [MessageActions.NONE], key: AN_OPTION_KEY },
            {
              actions: [MessageActions.NONE],
              key: ANOTHER_OPTION_KEY,
            },
          ],
          notification_type: PROMO_TYPE,
          state: null,
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
    setNotificationsResult({
      notifications: [
        {
          id: DIFFERENT_NOTIFICATION_ID,
          message: A_MESSAGE,
          options: [
            { actions: [MessageActions.NONE], key: AN_OPTION_KEY },
            {
              actions: [MessageActions.NONE],
              key: ANOTHER_OPTION_KEY,
            },
          ],
          notification_type: PROMO_TYPE,
          state: null,
        },
        {
          id: ANOTHER_NOTIFICATION_ID,
          message: ANOTHER_MESSAGE,
          options: [{ actions: [MessageActions.NONE], key: AN_OPTION_KEY }],
          notification_type: PROMO_TYPE,
          state: null,
        },
      ],
    });

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME);

    verify(
      stdinMock.write(DIFFERENT_NOTIFICATION_ACTION_HAPPENED, "utf8")
    ).once();

    verify(
      stdinMock.write(ANOTHER_NOTIFICATION_ACTION_HAPPENED, "utf8")
    ).once();
  });

  test("When multiple notifications with the same id returned, they are shown only once", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonSpy<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.spy(vscode.window, "showInformationMessage");

    setNotificationsResult(
      {
        notifications: [
          {
            id: SAME_NOTIFICATION_ID,
            message: A_MESSAGE,
            options: [
              { actions: [MessageActions.NONE], key: AN_OPTION_KEY },
              {
                actions: [MessageActions.NONE],
                key: ANOTHER_OPTION_KEY,
              },
            ],
            notification_type: PROMO_TYPE,
            state: null,
          },
        ],
      },
      {
        notifications: [
          {
            id: SAME_NOTIFICATION_ID,
            message: A_MESSAGE,
            options: [
              { actions: [MessageActions.NONE], key: AN_OPTION_KEY },
              {
                actions: [MessageActions.NONE],
                key: ANOTHER_OPTION_KEY,
              },
            ],
            notification_type: PROMO_TYPE,
            state: null,
          },
        ],
      }
    );

    await sleep(2 * (BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME));

    assert(
      showInformationMessage.calledOnceWithExactly(
        A_MESSAGE,
        AN_OPTION_KEY,
        ANOTHER_OPTION_KEY
      ),
      "Notification should show"
    );
  });
});
