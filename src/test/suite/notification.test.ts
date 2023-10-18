import * as assert from "assert";
import { afterEach } from "mocha";
import * as sinon from "sinon";
import { reset, verify } from "ts-mockito";
import * as vscode from "vscode";
import { Uri } from "vscode";
import {
  readLineMock,
  requestResponseItems,
  stdinMock,
  stdoutMock,
} from "../../binary/mockedRunProcess";
import { resetBinaryForTesting } from "../../binary/requests/requests";
import {
  BINARY_NOTIFICATION_POLLING_INTERVAL,
  MessageActionsEnum,
  StateType,
} from "../../globals/consts";
import { sleep } from "../../utils/utils";
import { BinaryGenericRequest, SOME_MORE_TIME } from "./utils/helper";
import { setNotificationsResult } from "./utils/notification.utils";
import {
  ANOTHER_MESSAGE,
  ANOTHER_NOTIFICATION_ACTION_HAPPENED,
  ANOTHER_NOTIFICATION_ID,
  ANOTHER_OPTION_KEY,
  aNotificationId,
  AN_OPTION_KEY,
  A_MESSAGE,
  DIFFERENT_NOTIFICATION_ACTION_HAPPENED,
  DIFFERENT_NOTIFICATION_ID,
  NOTIFICATIONS_REQUEST,
  PROMO_TYPE,
  SAME_NOTIFICATION_ID,
} from "./utils/testData";
import * as asExternalUri from "../../utils/asExternalUri";

type OpenWebviewParams = [
  viewType: string,
  title: string,
  showOptions:
    | vscode.ViewColumn
    | { viewColumn: vscode.ViewColumn; preserveFocus?: boolean },
  options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
];

suite("Should poll notifications", () => {
  afterEach(() => {
    reset(stdinMock);
    reset(stdoutMock);
    reset(readLineMock);
    requestResponseItems.length = 0;
    resetBinaryForTesting();
    sinon.verifyAndRestore();
  });

  test("Passes the correct request to binary process for notifications", async () => {
    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + 3 * SOME_MORE_TIME);

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
          id: aNotificationId(),
          message: A_MESSAGE,
          options: [
            { actions: [MessageActionsEnum.NONE], key: AN_OPTION_KEY },
            {
              actions: [MessageActionsEnum.NONE],
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
            { actions: [MessageActionsEnum.NONE], key: AN_OPTION_KEY },
            {
              actions: [MessageActionsEnum.NONE],
              key: ANOTHER_OPTION_KEY,
            },
          ],
          notification_type: PROMO_TYPE,
          state: null,
        },
        {
          id: ANOTHER_NOTIFICATION_ID,
          message: ANOTHER_MESSAGE,
          options: [{ actions: [MessageActionsEnum.NONE], key: AN_OPTION_KEY }],
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
              { actions: [MessageActionsEnum.NONE], key: AN_OPTION_KEY },
              {
                actions: [MessageActionsEnum.NONE],
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
              { actions: [MessageActionsEnum.NONE], key: AN_OPTION_KEY },
              {
                actions: [MessageActionsEnum.NONE],
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

  test("Opens the hub correctly once clicked", async () => {
    const REMOTE_HUB_URL = "https://hub/";
    const LOCAL_HUB_URL = "https://local-hub/";

    requestResponseItems.push({
      isQualified: (request) => {
        const configuration = JSON.parse(request) as BinaryGenericRequest<{
          Configuration: { quiet: boolean; source: StateType };
        }>;
        return !!configuration.request?.Configuration;
      },
      result: () => ({ message: REMOTE_HUB_URL }),
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonStub<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.stub(vscode.window, "showInformationMessage");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const createWebviewPanel: sinon.SinonStub<
      OpenWebviewParams,
      vscode.WebviewPanel
    > = sinon.spy(vscode.window, "createWebviewPanel");

    const asExternalUriSpy = sinon.stub(asExternalUri, "asExternalUri");

    asExternalUriSpy.callsFake(() => Promise.resolve(Uri.parse(LOCAL_HUB_URL)));

    showInformationMessage.onFirstCall().resolves(AN_OPTION_KEY);

    setNotificationsResult({
      notifications: [
        {
          id: aNotificationId(),
          message: A_MESSAGE,
          options: [
            { actions: [MessageActionsEnum.OPEN_HUB], key: AN_OPTION_KEY },
          ],
          notification_type: PROMO_TYPE,
          state: null,
        },
      ],
    });

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME);

    assert(createWebviewPanel.calledOnce, "Hub webview was created");
    assert(asExternalUriSpy.calledOnce, "asExternalUri invoked");
    assert.strictEqual(
      asExternalUriSpy.firstCall.args[0].toString(),
      REMOTE_HUB_URL
    );

    assert(
      !createWebviewPanel.firstCall.returnValue.webview.html.includes(
        REMOTE_HUB_URL
      )
    );
    assert(
      createWebviewPanel.firstCall.returnValue.webview.html.includes(
        LOCAL_HUB_URL
      )
    );

    createWebviewPanel.lastCall.returnValue.dispose();
  });

  test("Opens the hub correctly once clicked with params and path", async () => {
    const REMOTE_HUB_URL = "https://hub/";
    const REMOTE_HUB_WITH_PARAMS_AND_PATH =
      "https://hub/somePath%3Fparam1%3Dvalue1%26param2%3Dvalue2";
    const LOCAL_HUB_URL =
      "https://local-hub/somePath?param1=value1&param2=value2";

    requestResponseItems.push({
      isQualified: (request) => {
        const configuration = JSON.parse(request) as BinaryGenericRequest<{
          Configuration: { quiet: boolean; source: StateType };
        }>;
        return !!configuration.request?.Configuration;
      },
      result: () => ({ message: REMOTE_HUB_URL }),
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonStub<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.stub(vscode.window, "showInformationMessage");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const createWebviewPanel: sinon.SinonStub<
      OpenWebviewParams,
      vscode.WebviewPanel
    > = sinon.spy(vscode.window, "createWebviewPanel");

    const asExternalUriSpy = sinon.stub(asExternalUri, "asExternalUri");

    asExternalUriSpy.callsFake(() => Promise.resolve(Uri.parse(LOCAL_HUB_URL)));

    showInformationMessage.onFirstCall().resolves(AN_OPTION_KEY);

    setNotificationsResult({
      notifications: [
        {
          id: aNotificationId(),
          message: A_MESSAGE,
          options: [
            {
              actions: [
                {
                  OpenHubWith: {
                    query_params: [
                      ["param1", "value1"],
                      ["param2", "value2"],
                    ],
                    path: "/somePath",
                  },
                },
              ],
              key: AN_OPTION_KEY,
            },
          ],
          notification_type: PROMO_TYPE,
          state: null,
        },
      ],
    });

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME);

    assert(createWebviewPanel.calledOnce, "Hub webview was created");
    assert(asExternalUriSpy.calledOnce, "asExternalUri invoked");
    assert.strictEqual(
      asExternalUriSpy.firstCall.args[0].toString(),
      REMOTE_HUB_WITH_PARAMS_AND_PATH
    );

    assert(
      !createWebviewPanel.firstCall.returnValue.webview.html.includes(
        REMOTE_HUB_URL
      )
    );
    assert(
      createWebviewPanel.firstCall.returnValue.webview.html.includes(
        LOCAL_HUB_URL
      )
    );

    createWebviewPanel.lastCall.returnValue.dispose();
  });
});
