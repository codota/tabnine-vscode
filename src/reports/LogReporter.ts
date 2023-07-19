/* eslint-disable class-methods-use-this */

import { Logger } from "../utils/logger";
import EventName from "./EventName";

export default class LogReporter {
  report(event: EventName): void {
    Logger.info(`reporting event: ${event}`);
  }

  reportErrorEvent(event: EventName, error: Error): void {
    Logger.error(`reporting error event: ${event} ${error.message}`);
  }

  reportException(error: Error): void {
    Logger.error(`reporting exception:  ${error.message}`);
  }

  dispose(): Promise<unknown> {
    return Promise.resolve();
  }
}
