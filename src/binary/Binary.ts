import { Mutex } from "await-semaphore";
import * as child_process from "child_process";
import { createInterface, ReadLine } from "readline";
import {
  API_VERSION,
  CONSECUTIVE_RESTART_THRESHOLD,
  REQUEST_FAILURES_THRESHOLD,
  restartBackoff,
} from "../consts";
import { sleep } from "../utils";
import { runTabNine } from "./run";

export default class Binary {
  private consecutiveRestarts = 0;

  private requestFailures = 0;

  private isRestarting = false;

  private mutex: Mutex = new Mutex();

  private proc?: child_process.ChildProcess;

  private rl?: ReadLine;

  constructor() {
    this.startChild();
  }

  public async request<T>(
    request: any,
    timeout = 1000
  ): Promise<T | null | undefined> {
    const release = await this.mutex.acquire();

    try {
      if (this.isRestarting) {
        return null;
      }

      if (this.isBinaryDead()) {
        console.warn("Binary died. It is being restarted.");
        this.restartChild();

        return null;
      }

      this.proc?.stdin.write(
        `${JSON.stringify({
          version: API_VERSION,
          request,
        })  }\n`,
        "utf8"
      );

      const result = await this.readLineWithLimit(timeout);

      this.consecutiveRestarts = 0;
      this.requestFailures = 0;

      return JSON.parse(result.toString());
    } catch (err) {
      if (++this.requestFailures > REQUEST_FAILURES_THRESHOLD) {
        console.warn("Binary not returning results, it is being restarted.");
        this.restartChild();
      }
    } finally {
      release();
    }

    return null;
  }

  private readLineWithLimit(timeout: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      setTimeout(() => {
        reject("Binary request timed out.");
      }, timeout);

      this.rl?.once("line", resolve);
    });
  }

  private isBinaryDead(): boolean {
    return this.proc ? this.proc.killed : false;
  }

  private restartChild(): void {
    setImmediate(async () => {
      this.proc?.removeAllListeners();
      this.proc?.kill();

      this.isRestarting = true;

      if (++this.consecutiveRestarts >= CONSECUTIVE_RESTART_THRESHOLD) {
        return; // We gave up. Keep it dead.
      }

      await sleep(restartBackoff(this.consecutiveRestarts));
      this.startChild();
    });
  }

  private async startChild() {
    this.proc = runTabNine([`ide-restart-counter=${this.consecutiveRestarts}`]);
    this.rl = createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin,
    });
    this.isRestarting = false;
    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.proc.on("exit", (code, signal) => {
      console.warn(
        `Binary child process exited with code ${code} signal ${signal}`
      );
      this.restartChild();
    });
    this.proc.on("error", (error) => {
      console.warn(`Binary child process error: ${error}`);
      this.restartChild();
    });
    this.proc.stdin.on("error", (error) => {
      console.warn(`Binary child process stdin error: ${error}`);
      this.restartChild();
    });
    this.proc.stdout.on("error", (error) => {
      console.warn(`Binary child process stdout error: ${error}`);
      this.restartChild();
    });
  }
}
