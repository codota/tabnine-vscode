import * as vscode from "vscode";
// eslint-disable-next-line import/no-extraneous-dependencies
import { mock, when, reset } from "ts-mockito";
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from "chai";
import { getPredominantWorkspaceLanguage } from './basicContextHandler';

// Mock vscode
const MockedVSCode = mock<typeof vscode>();

describe('getPredominantWorkspaceLanguage', () => {

    afterEach(() => {
        reset(MockedVSCode);
    });

    it('should return expected language for given files', async () => {
        // Example: Mocking JavaScript and TypeScript files in the workspace
        const mockFiles:vscode.Uri[] = [
            vscode.Uri.parse("/path/to/file1.js"),
            vscode.Uri.parse("/path/to/file1.js")
        ];
        when(MockedVSCode.workspace.findFiles("**/*", null, 50)).thenReturn(mockFiles);

        const result = await getPredominantWorkspaceLanguage();
        expect(result).to.equal('javascript'); // assuming javascript is more dominant in this mock
    });

    // You can continue to write more tests by setting up different mock scenarios

});