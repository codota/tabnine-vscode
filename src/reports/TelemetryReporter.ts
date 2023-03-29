/* eslint-disable class-methods-use-this */
import Reporter from "vscode-extension-telemetry";
import getReportData from "./reportData";
import EventName from "./EventName";

export default class TelemetryReporter {
  private reporter: Reporter;

  constructor(id: string, version: string, key: string) {
    this.reporter = new Reporter(id, version, key);
  }

  dispose(): Promise<unknown> {
    return this.reporter.dispose();
  }

  report(event: EventName): void {
    void getReportData().then((data) =>
      this.reporter.sendTelemetryEvent(event, data)
    );
  }

  reportErrorEvent(event: EventName, error: Error): void {
    void getReportData().then((data) => {
      const fullData = { ...(data ?? {}), error: error.message };
      this.reporter.sendTelemetryErrorEvent(event, fullData);
    });
  }

  reportException(error: Error): void {
    void getReportData().then((data) => {
      this.reporter.sendTelemetryException(error, data);
    });
  }
}
