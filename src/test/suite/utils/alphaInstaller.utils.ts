import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import * as tmp from "tmp";
import * as https from "https";
import * as fs from "fs";
import * as url from 'url';
import { PassThrough } from "stream";
import * as capabilities from "../../../capabilities";
import handleAlpha from "../../../alphaInstaller";
import { LATEST_RELEASE_URL } from "../../../consts";
import * as context from "../../../extensionContext";


const getArtifactUrl = (version: string) => `https://github.com/codota/tabnine-vscode/releases/download/${version}/tabnine-vscode.vsix`;
const tempFileName = "testFile";
const minimalSupportedVscodeVersion = '1.35.0';

let installCommand: sinon.SinonStub;
    let isCapabilityEnabled: sinon.SinonStub<[capabilities.Capability], boolean>;
    let version: sinon.SinonStub;
    let installedVersion: sinon.SinonStub;
    let httpMock: sinon.SinonStub;
    let tmpMock: sinon.SinonStub<[cb: tmp.FileCallback], void>;
    let createWriteStreamMock: sinon.SinonStub;

export function initMocks() : void {
    isCapabilityEnabled = sinon.stub(capabilities, "isCapabilityEnabled");
        installCommand = sinon.stub(vscode.commands, 'executeCommand');
        version = sinon.stub(vscode, 'version')
        installedVersion = sinon.stub(context.tabnineContext, 'version')
        httpMock = sinon.stub(https, 'request');
        tmpMock = sinon.stub(tmp, 'file');
        createWriteStreamMock = sinon.stub(fs, 'createWriteStream');
        createWriteStreamMock.returns(new PassThrough())
}
export async function runInstallation(installed: string, available: string, vscodeVersion = minimalSupportedVscodeVersion, isAlpha = true) : Promise<void> {
    setIsAlpha(isAlpha);
    version.value(vscodeVersion);
    installedVersion.value(installed);
    const artifactUrl = getArtifactUrl(available);

    mockRequest([{ assets: [{ browser_download_url: artifactUrl}] }], LATEST_RELEASE_URL);
    mockRequest({ data: "test" }, artifactUrl);

    mockTempFile();

    return handleAlpha();
}

export function mockTempFile(): void {
    tmpMock.yields(null, tempFileName, null)
}

export function mockRequest(data: unknown, urlStr: string) : void {
    const streamMock: PassThrough & {statusCode?: number} = new PassThrough();
    streamMock.push(JSON.stringify(data));
    streamMock.end();
    streamMock.statusCode = 200;

    const parsedUrl = url.parse(urlStr);
    httpMock.withArgs({ host: parsedUrl.host, path: parsedUrl.path, rejectUnauthorized: false, headers: {"User-Agent": "TabNine.tabnine-vscode"} })
        .callsFake((_url, callback: ( stream: PassThrough & {statusCode?: number}) => void) => {
            callback(streamMock);
            return { end: sinon.stub(), on: sinon.stub() };
        })
}
export function assertWasNotInstalled(): void{
    assert(
        installCommand.withArgs("workbench.extensions.installExtension",
            vscode.Uri.file(`/${tempFileName}`)).notCalled,
        "Installation command should not have been executed"
    );
}
export function assertSuccessfulInstalled() : void{
    assert(
        installCommand.withArgs("workbench.extensions.installExtension",
            vscode.Uri.file(`/${tempFileName}`)).calledOnce,
        "Installation command should have been executed"
    );

}
export function setIsAlpha(isAlpha: boolean): void{
    isCapabilityEnabled.returns(isAlpha)
}