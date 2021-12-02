import * as sinon from "sinon";
import { afterEach, beforeEach } from "mocha";
import {
  assertSuccessfulInstalled,
  assertWasNotInstalled,
  initMocks,
  runInstallation,
} from "./utils/preReleaseInstaller.utils";
import { PROPOSED_ALPHA_VERSION } from "../../preRelease/installer";

suite("Should update proposed alpha release", () => {
  beforeEach(initMocks);

  afterEach(() => {
    sinon.restore();
  });

  test("in case of not alpha, do nothing", async () => {
    await runInstallation("v3.1.11", PROPOSED_ALPHA_VERSION, {
      isAlpha: false,
      isInsidersApp: true,
      isProposedAlphaChannelEnabled: true,
    });

    assertWasNotInstalled();
  });
  test("in case of proposed alpha channel disabled, do nothing", async () => {
    await runInstallation("v3.1.11", PROPOSED_ALPHA_VERSION, {
      isAlpha: true,
      isInsidersApp: true,
      isProposedAlphaChannelEnabled: false,
    });

    assertWasNotInstalled();
  });
  test("in case of not insiders, do nothing", async () => {
    await runInstallation("v3.1.11", PROPOSED_ALPHA_VERSION, {
      isAlpha: true,
      isInsidersApp: false,
      isProposedAlphaChannelEnabled: true,
    });

    assertWasNotInstalled();
  });
  test("in case of unsupported vscode version, do nothing", async () => {
    await runInstallation("v3.1.11", PROPOSED_ALPHA_VERSION, {
      isAlpha: true,
      isInsidersApp: true,
      vscodeVersion: "1.32.0",
      isProposedAlphaChannelEnabled: true,
    });

    assertWasNotInstalled();
  });
  [PROPOSED_ALPHA_VERSION, "v3.1.11"].forEach((version) =>
    test(`in case of current version is the proposed alpha version, do not install version ${version}`, async () => {
      await runInstallation(PROPOSED_ALPHA_VERSION, version, {
        isAlpha: true,
        isInsidersApp: true,
        isProposedAlphaChannelEnabled: true,
      });

      assertWasNotInstalled();
    })
  );
  test("in case of current version is not the proposed alpha version, install it", async () => {
    await runInstallation("v3.1.11", PROPOSED_ALPHA_VERSION, {
      isAlpha: true,
      isInsidersApp: true,
      isProposedAlphaChannelEnabled: true,
    });

    assertSuccessfulInstalled(PROPOSED_ALPHA_VERSION);
  });
});
