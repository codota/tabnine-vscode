import { expect } from "chai";
import * as fs from "fs";
import * as mock from "mock-fs";
import * as path from "path";
import * as sinon from "sinon";
import { afterEach } from "mocha";
import {
  downloadVersionPath,
  getRootPath,
  getUpdateVersion,
  versionPath,
} from "../../binary/paths";
import { initHttpMock, mockHttp, mockStreamResponse } from "./utils/http.mock";
import fetchBinaryPath from "../../binary/binaryFetcher";

suite("should run the relevant binary", () => {
  afterEach(() => {
    sinon.restore();
    mock.restore();
  });
  test("if .active exists return the active path", async () => {
    const rootPath = getRootPath();
    const currentVersion = "1.2.3";
    const activePath = path.join(rootPath, ".active");
    mock({
      [activePath]: `${currentVersion}`,
      [versionPath(currentVersion)]: "test binary",
    });

    const version = await fetchBinaryPath();
    const expectedVersion = versionPath(currentVersion);

    expect(version).to.equal(expectedVersion);
  });

  test("if .active does not exist but valid version exists, return the existing version", async () => {
    const currentVersion = "1.2.4";
    mock({
      [versionPath(currentVersion)]: "test binary",
    });

    const version = await fetchBinaryPath();
    const expectedVersion = versionPath(currentVersion);

    expect(version).to.equal(expectedVersion);
  });
  test("if no .active and no version exists, return the downloaded version", async () => {
    const versionToDownload = "1.2.5";
    const existsSyncMock = sinon.stub(fs, "existsSync");
    existsSyncMock.withArgs(versionPath(versionToDownload)).returns(true);
    existsSyncMock.withArgs(getRootPath()).returns(false);

    initHttpMock();
    mockHttp(versionToDownload, getUpdateVersion());
    mockStreamResponse(
      fs.createReadStream(path.join(__dirname, "..", "fixture", "TabNine.zip")),
      downloadVersionPath(versionToDownload)
    );

    const resultVersion = await fetchBinaryPath();
    const expectedVersion = versionPath(versionToDownload);

    expect(resultVersion).to.equal(expectedVersion);
  });
});
