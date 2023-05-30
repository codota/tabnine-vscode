import { Memento } from "vscode";

type GitHubAsset = {
  browser_download_url: string;
};

export type GitHubReleaseResponse = {
  assets: GitHubAsset[];
  prerelease: boolean;
  id: number;
}[];

export type ExtensionContext = { globalState: Memento };
