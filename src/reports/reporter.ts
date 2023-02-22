import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import getReportData from "./reportData";
import { ONPREM } from "../onPrem";

export enum EventName {
  EXTENSION_INSTALLED = "extension-installed",
  EXTENSION_ACTIVATED = "extension-activated",
  EXTENSION_UNINSTALLED = "extension-uninstalled",
  BUNDLE_DOWNLOAD_SUCCESS = "bundle-download-success",
  BUNDLE_DOWNLOAD_FAILURE = "bundle-download-failure",
  START_BINARY = "tabnine-binary-run",
}

let inTestMode = false;
let reporter: TelemetryReporter;

export function initReporter(
  context: ExtensionContext,
  id: string,
  version: string,
  key: string
): void {
  inTestMode = context.extensionMode === vscode.ExtensionMode.Test;

  if (inTestMode) {
    return;
  }
  if (ONPREM) {
    return;
  }

  reporter = new TelemetryReporter(id, version, key);
  context.subscriptions.push(reporter);
}

export function report(event: EventName): void {
  if (inTestMode) {
    return;
  }
  if (ONPREM) {
    return;
  }

  void getReportData().then((data) => reporter.sendTelemetryEvent(event, data));
}

export function reportErrorEvent(event: EventName, error: Error): void {
  if (inTestMode) {
    return;
  }
  if (ONPREM) {
    return;
  }

  void getReportData().then((data) => {
    const fullData = { ...(data ?? {}), error: error.message };
    reporter.sendTelemetryErrorEvent(event, fullData);
  });
}
export function reportException(error: Error): void {
  if (inTestMode) {
    return;
  }
  if (ONPREM) {
    return;
  }

  void getReportData().then((data) => {
    reporter.sendTelemetryException(error, data);
  });
}

export function disposeReporter(): void {
  void reporter.dispose();
}
