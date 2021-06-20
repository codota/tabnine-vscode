import * as sinon from "sinon";
import * as vscode from "vscode";
import * as assert from "assert";
import { afterEach, beforeEach } from "mocha";

import {
  assertSuccessfulInstalled,
  assertWasNotInstalled,
  initMocks,
  runInstallation,
  getUpdateGlobalStateMock,
} from "./utils/preReleaseInstaller.utils";
import { sleep } from "../../utils/utils";
import { BETA_CHANNEL_MESSAGE_SHOWN_KEY, BINARY_NOTIFICATION_POLLING_INTERVAL } from "../../globals/consts";
import { SOME_MORE_TIME } from "./utils/helper";

suite("Should update beta release", () => {
  beforeEach(initMocks);

  afterEach(() => {
    sinon.restore();
  });

  test("in case of not beta, do nothing", async () => {
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      vscodeVersion: "1.32.0",
    });

    assertWasNotInstalled();
  });
  test("in case of beta and unsupported vscode api(1.35), do nothing", async () => {
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: true,
      vscodeVersion: "1.32.0",
    });
    assertWasNotInstalled();
  });

  ["3.1.10", "3.0.10"].forEach((installed) => {
    test(`in case of TabNine released version is lower or equal to current version (${installed}), do nothing`, async () => {
      await runInstallation(installed, "v3.0.10", {
        isAlpha: false,
        isBetaChannelEnabled: true,
      });
      assertWasNotInstalled();
    });
  });
  test("in case of newer GA version, do nothing", async () => {
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: true,
    });
    assertWasNotInstalled();
  });

  test("in case of newer alpha version and current GA should update", async () => {
    const expectedVersion = "v3.1.11-alpha";
    await runInstallation("3.0.11", expectedVersion, {
      isAlpha: false,
      isBetaChannelEnabled: true,
    });
    assertSuccessfulInstalled(expectedVersion);
  });
  test("in case of same version and alpha version and current GA should update", async () => {
    const expectedVersion = "v3.1.11-alpha.1234";
    await runInstallation("3.1.11", expectedVersion, {
      isAlpha: false,
      isBetaChannelEnabled: true,
    });
    assertSuccessfulInstalled(expectedVersion);
  });

  test("in case of newer alpha version, install the new one", async () => {
    const expectedVersion = "v3.1.10-alpha.280345345";
    await runInstallation("3.1.10-alpha.150", expectedVersion, {
      isAlpha: false,
      isBetaChannelEnabled: true,
    });
    assertSuccessfulInstalled(expectedVersion);
  });

  test("in case of insider should show opt in message", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonSpy<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.spy(vscode.window, "showInformationMessage");

    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: false,
      isInsidersApp: true,
      betaChannelMessageShown: false,
    });

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME); // Wait for server activation

    assert(
      showInformationMessage.calledWithMatch("beta", "Settings"),
      "Join beta channel notification should show"
    );
    assert(
      getUpdateGlobalStateMock().withArgs(BETA_CHANNEL_MESSAGE_SHOWN_KEY, true).calledOnce
    );
  });

  test("in case of insider and message already shown should not show message", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonSpy<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.spy(vscode.window, "showInformationMessage");

    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: false,
      isInsidersApp: true,
      betaChannelMessageShown: true,
    });

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME); // Wait for server activation

    assert(showInformationMessage.notCalled);
  });

  test("in case of insider and beta enabled should not show message", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showInformationMessage: sinon.SinonSpy<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.spy(vscode.window, "showInformationMessage");

    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: true,
      isInsidersApp: true,
      betaChannelMessageShown: false,
    });

    await sleep(BINARY_NOTIFICATION_POLLING_INTERVAL + SOME_MORE_TIME); // Wait for server activation

    assert(showInformationMessage.notCalled);
  });
});
