import { EventName } from "./EventName";

export interface Reporter {
  report(event: EventName): void;
  reportErrorEvent(event: EventName, error: Error): void;
  reportException(error: Error): void;
}

let innerReporter: Reporter;

export function initReporter(reporter: Reporter) {
  innerReporter = reporter;
}

export function report(event: EventName): void {
  innerReporter.report(event);
}

export function reportErrorEvent(event: EventName, error: Error): void {
  innerReporter.reportErrorEvent(event, error);
}
export function reportException(error: Error): void {
  innerReporter.reportException(error);
}
