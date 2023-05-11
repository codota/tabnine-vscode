import * as child_process from "child_process";
import { Disposable, EventEmitter } from "vscode";
import { Mutex } from "await-semaphore";
import BinaryRequester from "./InnerBinary";
import runBinary from "./runBinary";
import {
  CONSECUTIVE_RESTART_THRESHOLD,
  REQUEST_FAILURES_THRESHOLD,
  restartBackoff,
  BINARY_RESTART_EVENT,
} from "../consts";
import { sleep } from "../utils/utils";

type RestartCallback = () => void;

export default class Binary {
  private mutex: Mutex = new Mutex();

  private innerBinary: BinaryRequester = new BinaryRequester();

  private proc?: child_process.ChildProcess;

  private consecutiveRestarts = 0;

  private requestFailures = 0;

  private isRestarting = false;

  private onRestartEventEmitter: EventEmitter<string> = new EventEmitter();

  private processRunArgs: string[] = [];

  public onRestart(callback: RestartCallback): Disposable {
    return this.onRestartEventEmitter.event(callback);
  }

  public async init(processRunArgs: string[]): Promise<void> {
    this.processRunArgs = processRunArgs;
    return this.startChild();
  }

  public pid(): number | undefined {
    return this.proc?.pid;
  }

  public async request<T, R = unknown>(
    request: R,
    timeout = 1000
  ): Promise<T | null | undefined> {
    const release = await this.mutex.acquire();

    try {
      if (this.isRestarting) {
        return null;
      }

      if (this.isBinaryDead()) {
        console.warn("Binary died. It is being restarted.");
        await this.restartChild();

        return null;
      }

      const result: T | null | undefined = await this.innerBinary.request(
        request,
        timeout
      );

      this.consecutiveRestarts = 0;
      this.requestFailures = 0;

      return result;
    } catch (err) {
      console.error(err);
      this.requestFailures += 1;
      if (this.requestFailures > REQUEST_FAILURES_THRESHOLD) {
        console.warn("Binary not returning results, it is being restarted.");
        await this.restartChild();
      }
    } finally {
      release();
    }

    return null;
  }

  private isBinaryDead(): boolean {
    return this.proc?.killed ?? false;
  }

  public async resetBinaryForTesting(): Promise<void> {
    const { proc, readLine } = await runBinary([]);

    this.proc = proc;
    this.innerBinary.init(proc, readLine);
  }

  public async restartChild(): Promise<void> {
    this.proc?.removeAllListeners();
    this.proc?.kill();

    this.isRestarting = true;
    this.consecutiveRestarts += 1;

    if (this.consecutiveRestarts >= CONSECUTIVE_RESTART_THRESHOLD) {
      return; // We gave up. Keep it dead.
    }

    await sleep(restartBackoff(this.consecutiveRestarts));
    await this.startChild();
    this.onRestartEventEmitter.fire(BINARY_RESTART_EVENT);
  }

  private async startChild() {
    const { proc, readLine } = await runBinary([
      ...this.processRunArgs,
      `ide-restart-counter=${this.consecutiveRestarts}`,
    ]);

    this.proc = proc;
    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.proc.on("exit", (code, signal) => {
      console.warn(
        `Binary child process exited with code ${code ?? "unknown"} signal ${
          signal ?? "unknown"
        }`
      );
      void this.restartChild();
    });
    this.proc.on("error", (error) => {
      console.warn(`Binary child process error: ${error.message}`);
      void this.restartChild();
    });
    this.proc.stdin?.on("error", (error) => {
      console.warn(`Binary child process stdin error: ${error.message}`);
      void this.restartChild();
    });
    this.proc.stdout?.on("error", (error) => {
      console.warn(`Binary child process stdout error: ${error.message}`);
      void this.restartChild();
    });

    this.innerBinary.init(proc, readLine);
    this.isRestarting = false;
  }
}
