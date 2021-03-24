import { ExtensionContext } from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import * as systeminformation from "systeminformation";

let reporter: TelemetryReporter;
let specs: Specs;

export type Specs = {
  os: OsInfo;
  cpu: CpuInfo;
  memoryBytes: number;
};

export type OsInfo = {
  platform: string;
  distro: string;
  arch: string;
  kernel: string;
};

export type CpuInfo = {
  manufacturer: string;
  brand: string;
  speedGHz: number;
  cores: number;
};

export enum EventName {
  EXTENSION_INSTALLED = "extension-installed",
  EXTENSION_ACTIVATED = "extension-activated",
  EXTENSION_UNINSTALLED = "extension-uninstalled",
  BUNDLE_DOWNLOAD_SUCCESS = "bundle-download-success",
  BUNDLE_DOWNLOAD_FAILURE = "bundle-download-failure",
  START_BINARY = "tabnine-binary-run",
}

export async function initReporter(
  context: ExtensionContext,
  id: string,
  version: string,
  key: string
): Promise<void> {
  reporter = new TelemetryReporter(id, version, key);
  context.subscriptions.push(reporter);
  const cpuData = await systeminformation.cpu();
  const osData = await systeminformation.osInfo();
  const memoryData = await systeminformation.mem();
  specs = {
    os: {
      platform: osData.platform,
      distro: osData.distro,
      arch: osData.arch,
      kernel: osData.kernel,
    },
    cpu: {
      manufacturer: cpuData.manufacturer,
      brand: cpuData.brand,
      speedGHz: cpuData.speed,
      cores: cpuData.cores,
    },
    memoryBytes: memoryData.total,
  };
}

export function report(event: EventName): void {
  const eventData = {
    timestamp: `${new Date().getTime()}`,
    os: `${specs.os.platform}-${specs.os.distro}-${specs.os.arch}`,
    kernel: `${specs.os.kernel}`,
    cpu: `${specs.cpu.manufacturer}-${specs.cpu.brand}`,
    cores: `${specs.cpu.cores}`,
    speedGHz: `${specs.cpu.speedGHz}`,
    memoryBytes: `${specs.memoryBytes}`,
  };
  console.log(JSON.stringify(eventData));
  reporter.sendTelemetryEvent(event, eventData);
}

export function reportErrorEvent(event: EventName, error: Error): void {
  reporter.sendTelemetryErrorEvent(event, { error: error.message });
}
export function reportException(error: Error): void {
  reporter.sendTelemetryException(error);
}

export function disposeReporter(): void {
  void reporter.dispose();
}
