import * as vscode from "vscode";
// eslint-disable-next-line import/no-extraneous-dependencies
import { mock, when, reset } from "ts-mockito";
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from "chai";
import { getPredominantWorkspaceLanguage } from "./basicContextHandler";

// Mock vscode
const MockedVSCode = mock<typeof vscode>();

describe("getPredominantWorkspaceLanguage", () => {
  afterEach(() => {
    reset(MockedVSCode);
  });

  it("should return expected language for given files", async () => {
    // Example: Mocking JavaScript and TypeScript files in the workspace
    const mockFiles = new Promise<vscode.Uri[]>(() => [
      vscode.Uri.parse("/path/to/file1.js"),
      vscode.Uri.parse("/path/to/file1.js"),
    ]);
    when(MockedVSCode.workspace.findFiles("**/*", null, 50)).thenReturn(
      mockFiles
    );

    const result = await getPredominantWorkspaceLanguage();
    expect(result).to.equal("javascript"); // assuming javascript is more dominant in this mock
  });

  it("should return undefined when file extensions are not known", async () => {
    // Example: Mocking JavaScript and TypeScript files in the workspace
    const mockFiles = new Promise<vscode.Uri[]>(() => [
      vscode.Uri.parse("/path/to/file1.unknown"),
      vscode.Uri.parse("/path/to/file1.unknown"),
    ]);
    when(MockedVSCode.workspace.findFiles("**/*", null, 50)).thenReturn(
      mockFiles
    );

    const result = await getPredominantWorkspaceLanguage();
    expect(result).to.equal(undefined); // assuming javascript is more dominant in this mock
  });

  it("should return the language which has most files in sample", async () => {
    // Example: Mocking JavaScript and TypeScript files in the workspace
    const mockFiles = new Promise<vscode.Uri[]>(() => [
      vscode.Uri.parse("/path/to/file1.js"),
      vscode.Uri.parse("/path/to/file1.js"),
      vscode.Uri.parse("/path/to/file2.go"),
      vscode.Uri.parse("/path/to/file3.go"),
      vscode.Uri.parse("/path/to/file4.go"),
    ]);
    when(MockedVSCode.workspace.findFiles("**/*", null, 50)).thenReturn(
      mockFiles
    );

    const result = await getPredominantWorkspaceLanguage();
    expect(result).to.equal("go"); // assuming javascript is more dominant in this mock
  });
});
