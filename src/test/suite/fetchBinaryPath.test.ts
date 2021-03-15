import { expect } from "chai";
import * as fs from "fs";
import * as mock from "mock-fs";
import * as sinon from "sinon";
import { afterEach } from "mocha";
import {
  downloadVersionPath,
  getActivePath,
  getUpdateVersion,
  versionPath,
} from "../../binary/paths";
import fetchBinaryPath from "../../binary/binaryFetcher";
import mockHttp from "./utils/http.mock";
import {
  ACTIVE_VERSION,
  EXISTING_VERSION,
  MOCKED_BINARY,
  MOCKED_ZIP_FILE,
  VERSION_DOWNLOAD,
} from "./utils/testData";

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
      [VERSION_DOWNLOAD, getUpdateVersion()],
      [
        fs.createReadStream(MOCKED_ZIP_FILE),
        downloadVersionPath(VERSION_DOWNLOAD),
      ]
    );

    const resultVersion = await fetchBinaryPath();
    const expectedVersion = versionPath(VERSION_DOWNLOAD);

    expect(resultVersion).to.equal(expectedVersion);
  });
});
