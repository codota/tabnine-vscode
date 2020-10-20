import { Mutex } from "await-semaphore";
import * as child_process from "child_process";
import { createInterface, ReadLine } from "readline";
import {
  API_VERSION,
  CONSECUTIVE_RESTART_THRESHOLD,
  restartBackoff,
} from "../consts";
import { sleep } from "../utils";
import { runTabNine } from "./run";

export default class Binary {
  private consecutiveRestarts: number = 0;
  private isRestarting: boolean = false;
  private mutex: Mutex = new Mutex();

  private proc?: child_process.ChildProcess = null;
  private rl: ReadLine;

  constructor() {
    setImmediate(() => {
      this.restartChild();
    });
  }

  public async request(request: any, timeout = 1000): Promise<any> {
    const release = await this.mutex.acquire();

    try {
      if (this.isRestarting) {
        throw new Error("TabNine process is restarting...");
      }

      if (this.isBinaryDead()) {
        setImmediate(() => {
          this.restartChild();
        });

        throw new Error("TabNine process is dead.");
      }

      this.proc.stdin.write(
        JSON.stringify({
          version: API_VERSION,
          request: request,
        }) + "\n",
        "utf8"
      );

      const result = await this.readLineWithLimit(timeout);

      this.consecutiveRestarts = 0;

      return JSON.parse(result.toString());
    } catch (err) {
      console.warn("Binary request failed.", err);
    } finally {
      release();
    }
  }

  private readLineWithLimit(timeout: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      setTimeout(() => {
        reject("Binary request timed out.");
      }, timeout);

      this.rl.once("line", resolve);
    });
  }

  private isBinaryDead(): boolean {
    return this.proc ? this.proc.killed : false;
  }

  private async restartChild(): Promise<void> {
    this.proc?.removeAllListeners();
    this.proc?.kill();

    this.isRestarting = true;

    if (++this.consecutiveRestarts >= CONSECUTIVE_RESTART_THRESHOLD) {
      return; // We gave up. Keep it dead.
    }

    await sleep(restartBackoff(this.consecutiveRestarts));

    this.proc = runTabNine([`ide-restart-counter=${this.consecutiveRestarts}`]);
    this.rl = createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin,
    });
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
