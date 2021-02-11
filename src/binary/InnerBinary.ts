import * as child_process from "child_process";
import { ReadLine } from "readline";
import { API_VERSION } from "../consts";
import OnceReader from "./OnceReader";

type UnkownWithToString = {
  toString(): string;
};

export default class InnerBinary {
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
    this.proc?.stdin.write(
    `${JSON.stringify({
        version: API_VERSION,
        request,
    })}\n`,
    "utf8"
    );

    const result = await this.readLineWithLimit(timeout);

    return JSON.parse(result.toString()) as T | null;
  }

  private readLineWithLimit(timeout: number): Promise<UnkownWithToString> {
    return new Promise<UnkownWithToString>((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Binary request timed out."));
      }, timeout);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.onceReader!.read(resolve);
    });
  }
}
