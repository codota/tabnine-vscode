import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import getReportData from "./reportData";
import {isSandboxed} from "../sandbox";

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
  if (isSandboxed()) {
    return;
  }
  inTestMode = context.extensionMode === vscode.ExtensionMode.Test;

  if (inTestMode) {
    return;
  }

  reporter = new TelemetryReporter(id, version, key);
  context.subscriptions.push(reporter);
}

export function report(event: EventName): void {
  if (isSandboxed()) {
    return;
  }
  if (inTestMode) {
    return;
  }

  void getReportData().then((data) => reporter.sendTelemetryEvent(event, data));
}

export function reportErrorEvent(event: EventName, error: Error): void {
  if (isSandboxed()) {
    return;
  }
  if (inTestMode) {
    return;
  }

  void getReportData().then((data) => {
    const fullData = { ...(data ?? {}), error: error.message };
    reporter.sendTelemetryErrorEvent(event, fullData);
  });
}
export function reportException(error: Error): void {
  if (isSandboxed()) {
    return;
  }
  if (inTestMode) {
    return;
  }

  void getReportData().then((data) => {
    reporter.sendTelemetryException(error, data);
  });
}

export function disposeReporter(): void {
  void reporter.dispose();
}
