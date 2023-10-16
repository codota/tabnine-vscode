import { promises as fs } from "fs";
import * as path from "path";
import * as extract from "extract-zip";
import * as semver from "semver";

import {
  downloadFileToDestination,
  downloadFileToStr,
} from "../../utils/download.utils";
import {
  getBundlePath,
  getDownloadVersionUrl,
  getUpdateVersionFileUrl,
  versionPath,
} from "../paths";
import { report } from "../../reports/reporter";
import { setDirectoryFilesAsExecutable } from "../utils";
import EventName from "../../reports/EventName";

type BundlePaths = {
  bundlePath: string;
  bundleDownloadUrl: string;
  bundleDirectory: string;
  executablePath: string;
};

export default async function downloadAndExtractBundle(): Promise<string> {
  const {
    bundlePath,
    bundleDownloadUrl,
    bundleDirectory,
    executablePath,
  } = await getBundlePaths();
  try {
    await createBundleDirectory(bundleDirectory);
    await downloadFileToDestination(bundleDownloadUrl, bundlePath);
    await extractBundle(bundlePath, bundleDirectory);
    await removeBundle(bundlePath);
    await setDirectoryFilesAsExecutable(bundleDirectory);
    report(EventName.BUNDLE_DOWNLOAD_SUCCESS);
    return executablePath;
  } finally {
    await removeBundle(bundlePath);
  }
}

async function removeBundle(bundlePath: string) {
  try {
    await fs.unlink(bundlePath);
    // eslint-disable-next-line no-empty
  } catch {}
}

async function getBundlePaths(): Promise<BundlePaths> {
  const version = await getCurrentVersion();
  const bundlePath = getBundlePath(version);
  const bundleDownloadUrl = getDownloadVersionUrl(version);
  const bundleDirectory = path.dirname(bundlePath);
  const executablePath = versionPath(version);
  return { bundlePath, bundleDownloadUrl, bundleDirectory, executablePath };
}

function createBundleDirectory(bundleDirectory: string): Promise<void> {
  return fs.mkdir(bundleDirectory, { recursive: true });
}

async function getCurrentVersion(): Promise<string> {
  const version = await downloadFileToStr(getUpdateVersionFileUrl());
  assertValidVersion(version);
  return version;
}

function assertValidVersion(version: string): void {
  if (!semver.valid(version)) {
    throw new Error(`invalid version: ${version}`);
  }
}

async function extractBundle(
  bundle: string,
  bundleDirectory: string
): Promise<void> {
  return extract(bundle, { dir: bundleDirectory });
}
