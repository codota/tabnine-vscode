import * as semver from "semver";
import {
  ALPHA_VERSION_KEY,
  MINIMAL_SUPPORTED_VSCODE_API,
} from "../globals/consts";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import { ExtensionContext } from "./types";

export function getCurrentVersion(
  context: ExtensionContext
): string | undefined {
  const persistedAlphaVersion = getPersistedAlphaVersion(context);
  return persistedAlphaVersion || tabnineExtensionProperties.version;
}

export function getPersistedAlphaVersion(
  context: ExtensionContext
): string | undefined {
  return context.globalState.get<string | undefined>(ALPHA_VERSION_KEY);
}

export function updatePersistedAlphaVersion(
  context: ExtensionContext,
  installedVersion: string | undefined
): Thenable<void> {
  return context.globalState.update(ALPHA_VERSION_KEY, installedVersion);
}

export function getAvailableAlphaVersion(artifactUrl: string): string {
  const versionPattern = /(?<=download\/)(.*)(?=\/tabnine-vscode)/gi;
  const match = artifactUrl.match(versionPattern);
  return (match && match[0]) || "";
}

export function isPreReleaseChannelSupported(): boolean {
  return semver.gte(
    tabnineExtensionProperties.vscodeVersion,
    MINIMAL_SUPPORTED_VSCODE_API
  );
}
