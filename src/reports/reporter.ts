import { ExtensionContext } from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import getReportData, { initReporterData } from "./reportData";

const inTestMode = process.env.NODE_ENV === "test";

export enum EventName {
  EXTENSION_INSTALLED = "extension-installed",
  EXTENSION_ACTIVATED = "extension-activated",
  EXTENSION_UNINSTALLED = "extension-uninstalled",
  BUNDLE_DOWNLOAD_SUCCESS = "bundle-download-success",
  BUNDLE_DOWNLOAD_FAILURE = "bundle-download-failure",
  START_BINARY = "tabnine-binary-run",
}

let reporter: TelemetryReporter;

export async function initReporter(
  context: ExtensionContext,
  id: string,
  version: string,
  key: string
): Promise<void> {
  if (inTestMode) return;

  reporter = new TelemetryReporter(id, version, key);
  await initReporterData();
  context.subscriptions.push(reporter);
}

export function report(event: EventName): void {
  if (inTestMode) return;

  reporter.sendTelemetryEvent(event, getReportData());
}

export function reportErrorEvent(event: EventName, error: Error): void {
  if (inTestMode) return;

  reporter.sendTelemetryErrorEvent(event, { error: error.message });
}
export function reportException(error: Error): void {
  if (inTestMode) return;

  reporter.sendTelemetryException(error);
}

export function disposeReporter(): void {
  void reporter.dispose();
}
