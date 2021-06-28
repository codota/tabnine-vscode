import * as sinon from "sinon";
import * as vscode from "vscode";
import * as assert from "assert";
import { afterEach, beforeEach } from "mocha";

import {
  initMocks,
  runInstallation,
  getUpdateGlobalStateMock,
} from "./utils/preReleaseInstaller.utils";
import { BETA_CHANNEL_MESSAGE_SHOWN_KEY } from "../../globals/consts";

let showInformationMessage: sinon.SinonStub;

suite("Should show beta channel notification", () => {
  beforeEach(() => {
    initMocks();
    showInformationMessage = sinon.stub(
      vscode.window,
      "showInformationMessage"
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  test("in case of insider should show opt in message", async () => {
    showInformationMessage.onFirstCall().resolves("Open Settings");
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: false,
      isInsidersApp: true,
      betaChannelMessageShown: false,
    });

    assert(
      showInformationMessage.calledWithMatch("beta", "Settings"),
      "Join beta channel notification should show"
    );
    assert(
      getUpdateGlobalStateMock().withArgs(BETA_CHANNEL_MESSAGE_SHOWN_KEY, true)
        .calledOnce
    );
  });

  test("in case of insider and message already shown should not show message", async () => {
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: false,
      isInsidersApp: true,
      betaChannelMessageShown: true,
    });

    assert(showInformationMessage.notCalled);
  });

  test("in case of insider and beta enabled should not show message", async () => {
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: true,
      isInsidersApp: true,
      betaChannelMessageShown: false,
    });

    assert(showInformationMessage.notCalled);
  });

  test("in case of not insider should not show message", async () => {
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: false,
      isInsidersApp: false,
      betaChannelMessageShown: false,
    });

    assert(showInformationMessage.notCalled);
  });

  test("in case of not insider and alpha should show message", async () => {
    showInformationMessage.onFirstCall().resolves("Open Settings");
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: true,
      isBetaChannelEnabled: false,
      isInsidersApp: false,
      betaChannelMessageShown: false,
    });

    assert(
      showInformationMessage.calledWithMatch("beta", "Settings"),
      "Join beta channel notification should show"
    );
    assert(
      getUpdateGlobalStateMock().withArgs(BETA_CHANNEL_MESSAGE_SHOWN_KEY, true)
        .calledOnce
    );
  });

  test("in case of insider but minimal version not supported should not show message", async () => {
    await runInstallation("3.0.11-alpha", "v3.1.11", {
      isAlpha: false,
      isBetaChannelEnabled: false,
      isInsidersApp: false,
      betaChannelMessageShown: false,
      vscodeVersion: "1.32.0",
    });

    assert(showInformationMessage.notCalled);
  });
});
