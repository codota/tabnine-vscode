import { Memento } from "vscode";

export type GitHubAsset = {
  browser_download_url: string;
};

export type GitHubReleaseResponse = {
  assets: GitHubAsset[];
}[];

export type ExtensionContext = { globalState: Memento };
