import * as child_process from "child_process";
import { Disposable, EventEmitter } from "vscode";
import BinaryRequester from "./InnerBinary";
import runBinary from "./runBinary";
import {
  CONSECUTIVE_RESTART_THRESHOLD,
  restartBackoff,
  BINARY_RESTART_EVENT,
} from "../globals/consts";
import { sleep } from "../utils/utils";

export type RestartCallback = () => void;

export default class Binary {
  private innerBinary: BinaryRequester = new BinaryRequester();

  private proc?: child_process.ChildProcess;

  private consecutiveRestarts = 0;

  private onRestartEventEmitter: EventEmitter<string> = new EventEmitter();

  public onRestart(callback: RestartCallback): Disposable {
    return this.onRestartEventEmitter.event(callback);
  }

  public async init(): Promise<void> {
    return this.startChild();
  }

  public pid(): number | undefined {
    return this.proc?.pid;
  }

  public async resetBinaryForTesting(): Promise<void> {
    const { proc, readLine } = await runBinary([]);

    this.proc = proc;
    this.innerBinary.init(proc, readLine);
  }

  public async restartChild(): Promise<void> {
    this.proc?.removeAllListeners();
    this.proc?.kill();

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
  }
}
