import { expect } from "chai";
import * as vscode from "vscode";
import * as fs from "fs";
import * as mock from "mock-fs";
import * as sinon from "sinon";
import * as assert from "assert";
import { afterEach } from "mocha";
import {
  getActivePath,
  getDownloadVersionUrl,
  getUpdateVersionFileUrl,
  versionPath,
} from "../../binary/paths";
import fetchBinaryPath from "../../binary/binaryFetcher";
import mockHttp from "./utils/http.mock";
import {
  ACTIVE_VERSION,
  DOWNLOAD_ERROR,
  EXISTING_VERSION,
  MOCKED_BINARY,
  MOCKED_ZIP_FILE,
  VERSION_DOWNLOAD,
} from "./utils/testData";
import {
  BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
  OPEN_NETWORK_SETUP_HELP,
  RELOAD_BUTTON,
} from "../../globals/consts";

suite("should run the relevant binary", () => {
  afterEach(() => {
    sinon.restore();
    mock.restore();
  });
  test("if .active exists return the active path", async () => {
    mock({
      [getActivePath()]: `${ACTIVE_VERSION}`,
      [versionPath(ACTIVE_VERSION)]: MOCKED_BINARY,
    });

    const version = await fetchBinaryPath();
    const expectedVersion = versionPath(ACTIVE_VERSION);

    expect(version).to.equal(expectedVersion);
  });

  test("if .active does not exist but valid version exists, return the existing version", async () => {
    mock({
      [versionPath(EXISTING_VERSION)]: MOCKED_BINARY,
    });

    const version = await fetchBinaryPath();
    const expectedVersion = versionPath(EXISTING_VERSION);

    expect(version).to.equal(expectedVersion);
  });
  test("if no .active and no version exists, return the downloaded version", async () => {
    mock({
      [MOCKED_ZIP_FILE]: mock.load(MOCKED_ZIP_FILE),
    });

    mockHttp(
      [VERSION_DOWNLOAD, getUpdateVersionFileUrl()],
      [
        fs.createReadStream(MOCKED_ZIP_FILE),
        getDownloadVersionUrl(VERSION_DOWNLOAD),
      ]
    );

    const resultVersion = await fetchBinaryPath();
    const expectedVersion = versionPath(VERSION_DOWNLOAD);

    expect(resultVersion).to.equal(expectedVersion);
  });
  test("if download failed, show error message", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showErrorMessage: sinon.SinonStub<
      [message: string, ...items: string[]],
      Thenable<string | undefined>
    > = sinon.stub(vscode.window, "showErrorMessage");

    showErrorMessage.onFirstCall().resolves();

    mock();

    mockHttp(
      [VERSION_DOWNLOAD, getUpdateVersionFileUrl()],
      [DOWNLOAD_ERROR, getDownloadVersionUrl(VERSION_DOWNLOAD)]
    );
    await assert.rejects(fetchBinaryPath, DOWNLOAD_ERROR);
    assert(
      showErrorMessage.withArgs(
        BUNDLE_DOWNLOAD_FAILURE_MESSAGE,
        RELOAD_BUTTON,
        OPEN_NETWORK_SETUP_HELP
      ).called,
      "Download error message should be shown"
    );
  });
});
