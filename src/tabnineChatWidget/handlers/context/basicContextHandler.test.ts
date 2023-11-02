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
    const mockFiles = new Promise<vscode.Uri[]>(() => [
      vscode.Uri.parse("/path/to/file1.js"),
      vscode.Uri.parse("/path/to/file1.js"),
    ]);
    when(MockedVSCode.workspace.findFiles("**/*", null, 50)).thenReturn(
      mockFiles
    );

    const result = await getPredominantWorkspaceLanguage();
    expect(result).to.equal("javascript");
  });

  it("should return undefined when file extensions are not known", async () => {
    const mockFiles = new Promise<vscode.Uri[]>(() => [
      vscode.Uri.parse("/path/to/file1.unknown"),
      vscode.Uri.parse("/path/to/file1.unknown"),
    ]);
    when(MockedVSCode.workspace.findFiles("**/*", null, 50)).thenReturn(
      mockFiles
    );

    const result = await getPredominantWorkspaceLanguage();
    expect(result).to.equal(undefined);
  });

  it("should return the language which has most files in sample", async () => {
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
    expect(result).to.equal("go");
  });
});
