import * as child_process from "child_process";
import { ReadLine } from "readline";
import { API_VERSION } from "../globals/consts";
import OnceReader from "./OnceReader";

type UnknownWithToString = {
  toString(): string;
};

export default class BinaryRequester {
  private onceReader?: OnceReader;

  private proc?: child_process.ChildProcess;

  public init(proc: child_process.ChildProcess, readline: ReadLine): void {
    this.proc = proc;
    this.onceReader = new OnceReader(readline);
  }

  public async request<T, R = unknown>(
    request: R,
    timeout = 1000
  ): Promise<T | null | undefined> {
    const result = await this.requestWithTimeout(request, timeout);

    return JSON.parse(result.toString()) as T | null;
  }

  private requestWithTimeout<T>(
    request: T,
    timeout: number
  ): Promise<UnknownWithToString> {
    return new Promise<UnknownWithToString>((resolve, reject) => {
      setTimeout(() => {
        reject(
          new Error(`Binary request timed out. ${JSON.stringify(request)}`)
        );
      }, timeout);

      this.onceReader?.onLineRead(resolve);

      this.proc?.stdin?.write(
        `${JSON.stringify({
          version: API_VERSION,
          request,
        })}\n`,
        "utf8"
      );
    });
  }
}
