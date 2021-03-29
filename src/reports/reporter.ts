import { ExtensionContext } from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import getReportData from "./reportData";

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

export function initReporter(
  context: ExtensionContext,
  id: string,
  version: string,
  key: string
): void {
  if (inTestMode) return;

  reporter = new TelemetryReporter(id, version, key);
  context.subscriptions.push(reporter);
}

export function report(event: EventName): void {
  if (inTestMode) return;

  void (async () => {
    const data = await getReportData();
    reporter.sendTelemetryEvent(event, data);
  })();
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
