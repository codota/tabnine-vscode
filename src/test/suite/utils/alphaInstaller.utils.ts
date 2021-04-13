import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as tmp from "tmp";
import * as fs from "fs";
import { PassThrough } from "stream";
import * as capabilities from "../../../capabilities";
import handleAlpha, { ExtensionContext } from "../../../alphaInstaller";
import { ALPHA_VERSION_KEY, LATEST_RELEASE_URL } from "../../../globals/consts";
import tabnineExtensionProperties from "../../../globals/tabnineExtensionProperties";
import mockHttp from "./http.mock";

const getArtifactUrl = (version: string) =>
  `https://github.com/codota/tabnine-vscode/releases/download/${version}/tabnine-vscode.vsix`;
const tempFileName = "testFile";
const minimalSupportedVscodeVersion = "1.35.0";

let installCommand: sinon.SinonStub;
let isCapabilityEnabled: sinon.SinonStub<[capabilities.Capability], boolean>;
let version: sinon.SinonStub;
let installedVersion: sinon.SinonStub;
let tmpMock: sinon.SinonStub<[cb: tmp.FileCallback], void>;
let createWriteStreamMock: sinon.SinonStub;
let updateVersion: sinon.SinonStub<
  [key: string, value: string],
  Thenable<void>
>;

export function initMocks(): void {
  isCapabilityEnabled = sinon.stub(capabilities, "isCapabilityEnabled");
  installCommand = sinon.stub(vscode.commands, "executeCommand");
  version = sinon.stub(vscode, "version");
  installedVersion = sinon.stub(tabnineExtensionProperties, "version");
  tmpMock = sinon.stub(tmp, "file");
  createWriteStreamMock = sinon.stub(fs, "createWriteStream");
  createWriteStreamMock.returns(new PassThrough());
  updateVersion = sinon.stub();
}
export async function runInstallation(
  installed: string,
  available: string,
  vscodeVersion = minimalSupportedVscodeVersion,
  isAlpha = true
): Promise<void> {
  setIsAlpha(isAlpha);
  version.value(vscodeVersion);
  installedVersion.value(installed);
  const artifactUrl = getArtifactUrl(available);

  mockHttp(
    [[{ assets: [{ browser_download_url: artifactUrl }] }], LATEST_RELEASE_URL],
    [{ data: "test" }, artifactUrl]
  );

  mockTempFile();

  return handleAlpha(getContext(vscodeVersion));
}

function getContext(vscodeVersion: string): ExtensionContext {
  return {
    globalState: {
      get: sinon.stub().returns(vscodeVersion),
      update: updateVersion,
    },
  };
}

export function mockTempFile(): void {
  tmpMock.yields(null, tempFileName, null);
}
export function assertWasNotInstalled(): void {
  assert(
    installCommand.withArgs(
      "workbench.extensions.installExtension",
      vscode.Uri.file(`/${tempFileName}`)
    ).notCalled,
    "Installation command should not have been executed"
  );
}
export function assertSuccessfulInstalled(expectedVersion: string): void {
  assert(
    installCommand.withArgs(
      "workbench.extensions.installExtension",
      vscode.Uri.file(`/${tempFileName}`)
    ).calledOnce,
    "Installation command should have been executed"
  );
  assert(updateVersion.withArgs(ALPHA_VERSION_KEY, expectedVersion).calledOnce);
}
export function setIsAlpha(isAlpha: boolean): void {
  isCapabilityEnabled.returns(isAlpha);
}
