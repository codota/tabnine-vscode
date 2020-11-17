import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { afterEach, beforeEach } from "mocha";
import * as https from "https";
import * as tmp from "tmp";
import * as fs from "fs";
import { PassThrough } from "stream";
import * as context from "../../extensionContext";
import * as capabilities from "../../capabilities";

import handleAlpha from '../../alphaInstaller';

const latestReleaseUrl = "https://api.github.com/repos/codota/tabnine-vscode/releases/latest";
const getArtifactUrl = (version: string) => `https://github.com/codota/tabnine-vscode/releases/download/${version}/tabnine-vscode.vsix`;
const tempFileName = "testFile";
const minimalSupportedVscodeVersion = '1.35.0';
const extensionId = context.tabnineContext.id || "TabNine.tabnine-vscode";

suite("Should update alpha release", () => {
    let installCommand: sinon.SinonStub;
    let isCapabilityEnabled: sinon.SinonStub<[capabilities.Capability], boolean>;
    let version: sinon.SinonStub;
    let installedVersion: sinon.SinonStub;
    let httpMock: sinon.SinonStub;
    let tmpMock: sinon.SinonStub<[cb: tmp.FileCallback], void>;
    let createWriteStreamMock: sinon.SinonStub;

    beforeEach(() => {
        isCapabilityEnabled = sinon.stub(capabilities, "isCapabilityEnabled");
        installCommand = sinon.stub(vscode.commands, 'executeCommand');
        version = sinon.stub(vscode, 'version')
        installedVersion = sinon.stub(context.tabnineContext, 'version')
        httpMock = sinon.stub(https, 'request');
        tmpMock = sinon.stub(tmp, 'file');
        createWriteStreamMock = sinon.stub(fs, 'createWriteStream');
        createWriteStreamMock.returns(new PassThrough())
    });
    afterEach(() => {
        installCommand.restore();
        isCapabilityEnabled.restore();
        version.restore();
        installedVersion.restore();
        httpMock.restore();
        tmpMock.restore();
        createWriteStreamMock.restore();
    });

    test("in case of not alpha, do nothing, return false", async () => {
        setIsAlpha(false);

        await handleAlpha();

        assertWasNotInstalled();
    });
    test("in case of alpha and unsupported vscode api(1.35), do nothing, return false", async () => {
        setIsAlpha(true);
        version.value('1.32.0');

        await handleAlpha();

        assertWasNotInstalled();
    });

    ['3.1.10', '3.0.10'].forEach((installed) => {
        test(`in case of TabNine released version is lower or equal to current version (${installed}), do nothing, return false`, async () => {
            await runInstallation(installed, "v3.0.10", -1)
            assertWasNotInstalled();
        })
    })

    test("in case of newer released version should update, return true", async () => {
        await runInstallation("3.1.10", "v3.1.11-alpha");
        assertSuccessfulInstalled();
    })

    test("in case of newer alpha version (will be the same version number but with latest updated_at date), uninstall the current version and install the new one", async () => {
        await runInstallation("3.1.10-alpha", "v3.1.10-alpha");
        assertSuccessfulInstalled();
    })

    async function runInstallation(installed: string, available: string, daysSinceUpdate = 1){
        setIsAlpha(true);
        version.value(minimalSupportedVscodeVersion);
        installedVersion.value(installed);
        const updatedAt = getUpdatedAt({days: daysSinceUpdate})
        const artifactUrl = getArtifactUrl(available);

        mockRequest({ assets: [{ browser_download_url: artifactUrl, updated_at: updatedAt}] }, latestReleaseUrl);
        mockRequest({ data: "test" }, artifactUrl);

        mockTempFile();

        return handleAlpha();
    }

    function mockTempFile(){
        tmpMock.yields(null, tempFileName, null)
    }

    function mockRequest(data: unknown, url: string) {
        const streamMock: PassThrough & {statusCode?: number} = new PassThrough();
        streamMock.push(JSON.stringify(data));
        streamMock.end();
        streamMock.statusCode = 200;

        httpMock.withArgs(url)
            .callsFake((_url, callback: ( stream: PassThrough & {statusCode?: number}) => void) => {
                callback(streamMock);
                return { end: sinon.stub(), on: sinon.stub() };
            })
    }
    function assertWasNotInstalled() {
        assert(
            installCommand.withArgs("workbench.extensions.installExtension",
                vscode.Uri.file(`/${tempFileName}`)).notCalled,
            "Installation command should not have been executed"
        );
        assert(
            installCommand.withArgs("workbench.extensions.uninstallExtension",
            extensionId).notCalled,
            "uninstall command should have been executed"
        );
    }
    function assertSuccessfulInstalled() {
        assert(
            installCommand.withArgs("workbench.extensions.uninstallExtension",
            extensionId).calledOnce,
            "uninstall command should have been executed"
        );
        assert(
            installCommand.withArgs("workbench.extensions.installExtension",
                vscode.Uri.file(`/${tempFileName}`)).calledOnce,
            "Installation command should have been executed"
        );

    }
    function setIsAlpha(isAlpha: boolean) {
        isCapabilityEnabled.returns(isAlpha)
    }
    function getUpdatedAt({days}: {days: number}) {
        const updatedAt = new Date();
        updatedAt.setDate(updatedAt.getDate() + days);
        return updatedAt;
    }
})


