import { Memento } from "vscode";

type GitHubAsset = {
  browser_download_url: string;
};

export type GitHubReleaseResponse = {
  assets: GitHubAsset[];
}[];

export type ExtensionContext = { globalState: Memento };
