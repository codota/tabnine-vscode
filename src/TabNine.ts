import { Mutex } from "await-semaphore";
import * as child_process from "child_process";
import { createInterface, ReadLine } from "readline";
import { runTabNine } from "./BinaryRun";
import {
  API_VERSION,
  CONSECUTIVE_RESTART_THRESHOLD,
  MAX_SLEEP_TIME_BETWEEN_ATTEMPTS,
  SLEEP_TIME_BETWEEN_ATTEMPTS,
} from "./consts";

export class TabNine {
  private consecutiveRestarts: number = 0;
  private childDead: boolean = true;
  private mutex: Mutex = new Mutex();

  private proc: child_process.ChildProcess;
  private rl: ReadLine;

  constructor() {
    this.restartChild();
  }

  public async request(request: any, timeout = 1000): Promise<any> {
    const release = await this.mutex.acquire();

    try {
      if (this.isBinaryDead()) {
        this.restartChild();

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
    } finally {
      console.log("Binary request failed.");
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
    return this.childDead || this.proc?.killed;
  }

  private restartChild(): void {
    if (++this.consecutiveRestarts >= CONSECUTIVE_RESTART_THRESHOLD) {
      return; // We gave up. Keep it dead.
    }

    this.proc?.kill();
    this.proc = runTabNine([`ide-restart-counter=${this.consecutiveRestarts}`]);
    this.rl = createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin,
    });
    this.childDead = false;

    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.proc.on("exit", (code, signal) => {
      console.warn(
        `Binary child process exited with code ${code} signal ${signal}`
      );
      this.onChildDeath();
    });
    this.proc.on("error", (error) => {
      console.warn(`binary process error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stdin.on("error", (error) => {
      console.warn(`stdin error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stdout.on("error", (error) => {
      console.warn(`stdout error: ${error}`);
      this.onChildDeath();
    });
  }

  private onChildDeath() {
    this.childDead = true;

    setTimeout(() => {
      if (this.isBinaryDead()) {
        this.restartChild();
      }
    }, this.restartBackoff(this.consecutiveRestarts));
  }

  private restartBackoff(attempt: number): number {
    return Math.min(
      SLEEP_TIME_BETWEEN_ATTEMPTS * Math.pow(2, Math.min(attempt, 10)),
      MAX_SLEEP_TIME_BETWEEN_ATTEMPTS
    );
  }
}

export const tabNineProcess = new TabNine();
