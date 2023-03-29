/* eslint-disable class-methods-use-this */

import EventName from "./EventName";

export default class LogReporter {
  report(event: EventName): void {
    console.info(`reporting event: ${event}`);
  }

  reportErrorEvent(event: EventName, error: Error): void {
    console.error(`reporting error event: ${event}`, error);
  }

  reportException(error: Error): void {
    console.error(`reporting exception:`, error);
  }

  dispose(): Promise<unknown> {
    return Promise.resolve();
  }
}
