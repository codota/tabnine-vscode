import { ExtensionContext } from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";

let reporter: TelemetryReporter;
export enum EventName {
  EXTENSION_INSTALLED = "extension-installed",
  EXTENSION_ACTIVATED = "extension-activated",
  BUNDLE_DOWNLOAD_SUCCESS = "bundle-download-success",
  BUNDLE_DOWNLOAD_FAILURE = "bundle-download-failure",
  START_BINARY = "tabnine-binary-run",
}

export function initReporter(
  context: ExtensionContext,
  id: string,
  version: string,
  key: string
): void {
  reporter = new TelemetryReporter(id, version, key);
  context.subscriptions.push(reporter);
}

export function report(event: EventName): void {
  reporter.sendTelemetryEvent(event);
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
