import * as mockFs from "mock-fs";
import { BINARY_ROOT_PATH } from "../../consts";
import getMostRelevantVersion from "../../binary/donwload/versionFetcher";
// import sinon = require("sinon");
import { Memento } from "vscode";
import assert = require("assert");
import { afterEach } from "mocha";
import * as tsMockitoMock from "ts-mockito";
import { instance, when } from "ts-mockito";
import VersionChecker from "../../binary/donwload/versionChecker";
import { versionPath } from "../../binary/paths";

export type ExtensionContext = { globalState: Memento };

// const MINIMAL_VERSION = "0.0.0";
const versionCheckerMock: VersionChecker = tsMockitoMock.mock();

// let updateVersion: sinon.SinonStub<
//   [key: string, value: string],
//   Thenable<void>
// >;

type VersionMock = {
  version: string;
  isWorking: boolean;
};

function mockExistingVersions(versions: VersionMock[]) {
  const root = {};

  const versionFolders = {};
  versions.forEach((versionMock) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    versionFolders[versionMock.version] = {};
    when(
      versionCheckerMock.isWorking(versionPath(versionMock.version))
    ).thenReturn(versionMock.isWorking);
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  root[BINARY_ROOT_PATH] = versionFolders;
  mockFs(root);
}

// function getContext(): ExtensionContext {
//   return {
//     globalState: {
//       get: sinon.stub().returns(MINIMAL_VERSION),
//       update: updateVersion,
//     },
//   };
// }

suite("Should fetch versions correctly", () => {
  afterEach(() => {
    mockFs.restore();
    tsMockitoMock.reset(versionCheckerMock);
  });
  test("when local binary exists should return it", () => {
    mockExistingVersions([{ version: "1.1.1", isWorking: true }]);

    expectMostRelevantVersionToBe("1.1.1");
  });
  test("when 2 local binaries exists should return the latest", () => {
    mockExistingVersions([
      { version: "1.1.1", isWorking: true },
      { version: "2.2.2", isWorking: true },
    ]);

    expectMostRelevantVersionToBe("2.2.2");
  });
  test("1 when latest version doesnt work should return the one before", () => {
    mockExistingVersions([
      { version: "1.1.1", isWorking: false },
      { version: "2.2.2", isWorking: true },
      { version: "3.3.3", isWorking: false },
    ]);

    expectMostRelevantVersionToBe("2.2.2");
  });
  test("when none of the versions work should return null", () => {
    mockExistingVersions([
      { version: "1.1.1", isWorking: false },
      { version: "2.2.2", isWorking: false },
      { version: "3.3.3", isWorking: false },
    ]);

    expectMostRelevantVersionToBe(undefined);
  });
});

function expectMostRelevantVersionToBe(expected: string | undefined) {
  const version = getMostRelevantVersion(instance(versionCheckerMock));

  assert(
    version === expected,
    `Expected ${JSON.stringify(version)} to be ${JSON.stringify(expected)}`
  );
}
