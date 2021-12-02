import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as tmp from "tmp";
import * as fs from "fs";
import { PassThrough } from "stream";
import * as capabilities from "../../../capabilities/capabilities";
import handlePreReleaseChannels, {
  PROPOSED_ALPHA_ARTIFACTS_URL,
} from "../../../preRelease/installer";
import {
  ALPHA_VERSION_KEY,
  BETA_CHANNEL_MESSAGE_SHOWN_KEY,
  LATEST_RELEASE_URL,
} from "../../../globals/consts";
import tabnineExtensionProperties from "../../../globals/tabnineExtensionProperties";
import mockHttp from "./http.mock";
import { ExtensionContext } from "../../../preRelease/types";

const getArtifactUrl = (version: string) =>
  `https://github.com/codota/tabnine-vscode/releases/download/${version}/tabnine-vscode.vsix`;
const tempFileName = "testFile";
const minimalSupportedVscodeVersion = "1.35.0";

let installCommand: sinon.SinonStub;
let isCapabilityEnabled: sinon.SinonStub<[capabilities.Capability], boolean>;
let version: sinon.SinonStub;
let installedVersion: sinon.SinonStub;
let appName: sinon.SinonStub;
let betaChannelEnabled: sinon.SinonStub;
let proposedAlphaChannelEnabled: sinon.SinonStub;
let tmpMock: sinon.SinonStub<[cb: tmp.FileCallback], void>;
let createWriteStreamMock: sinon.SinonStub;
let updateGlobalState: sinon.SinonStub<
  [key: string, value: string | boolean],
  Thenable<void>
>;

export function getUpdateGlobalStateMock(): sinon.SinonStub<
  [key: string, value: string | boolean],
  Thenable<void>
> {
  return updateGlobalState;
}

export type RunInstallationOptions = {
  vscodeVersion: string;
  isInsidersApp: boolean;
  isAlpha: boolean;
  isBetaChannelEnabled: boolean;
  isProposedAlphaChannelEnabled: boolean;
  betaChannelMessageShown: boolean;
};

export type ContextGetMocks = {
  [key: string]: boolean | string | number | undefined | null;
};

export function initMocks(): void {
  isCapabilityEnabled = sinon.stub(capabilities, "isCapabilityEnabled");
  installCommand = sinon.stub(vscode.commands, "executeCommand");
  version = sinon.stub(vscode, "version");
  appName = sinon.stub(tabnineExtensionProperties, "isVscodeInsiders");
  installedVersion = sinon.stub(tabnineExtensionProperties, "version");
  betaChannelEnabled = sinon.stub(
    tabnineExtensionProperties,
    "isExtentionBetaChannelEnabled"
  );
  proposedAlphaChannelEnabled = sinon.stub(
    tabnineExtensionProperties,
    "isProposedAlphaChannelEnabled"
  );
  tmpMock = sinon.stub(tmp, "file");
  createWriteStreamMock = sinon.stub(fs, "createWriteStream");
  createWriteStreamMock.returns(new PassThrough());
  updateGlobalState = sinon.stub();
}

export async function runInstallation(
  installed: string,
  available: string,
  options?: Partial<RunInstallationOptions>
): Promise<void> {
  const vscodeVersion = options?.vscodeVersion || minimalSupportedVscodeVersion;

  setIsAlpha(options?.isAlpha === undefined ? true : options.isAlpha);
  appName.value(options?.isInsidersApp || false);
  version.value(vscodeVersion);
  betaChannelEnabled.value(options?.isBetaChannelEnabled || false);
  proposedAlphaChannelEnabled.value(
    options?.isProposedAlphaChannelEnabled || false
  );
  installedVersion.value(installed);
  const artifactUrl = getArtifactUrl(available);
  console.log(artifactUrl);
  mockHttp(
    [[{ assets: [{ browser_download_url: artifactUrl }] }], LATEST_RELEASE_URL],
    [{ data: "test" }, artifactUrl],
    [{ data: "test" }, PROPOSED_ALPHA_ARTIFACTS_URL]
  );

  mockTempFile();

  return handlePreReleaseChannels(
    getContext({
      [ALPHA_VERSION_KEY]: installed,
      [BETA_CHANNEL_MESSAGE_SHOWN_KEY]:
        options?.betaChannelMessageShown || false,
    })
  );
}

function getContext(contextGetMocks: ContextGetMocks): ExtensionContext {
  return {
    globalState: {
      get: (key: string) => contextGetMocks[key],
      update: updateGlobalState,
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
  assert(
    updateGlobalState.withArgs(ALPHA_VERSION_KEY, expectedVersion).calledOnce
  );
}
export function setIsAlpha(isAlpha: boolean): void {
  isCapabilityEnabled.returns(isAlpha);
}
