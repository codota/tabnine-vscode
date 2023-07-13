import { Mutex } from "await-semaphore";
import * as child_process from "child_process";
import * as readline from "readline";
import run from "./runAssistant";
import { Logger } from "../utils/logger";

export default class AssistantProcess {
  private proc?: child_process.ChildProcess;

  private rl?: readline.ReadLine;

  private numRestarts = 0;

  private childDead = false;

  private mutex: Mutex = new Mutex();

  private resolveMap = new Map();

  private isShutdown = false;

  constructor() {
    this.restartChild();
  }

  async post<T extends { id: number; version: string }, R>(
    anyRequest: T,
    id: number,
    timeToSleep = 10000
  ): Promise<R | undefined> {
    const release = await this.mutex.acquire();

    try {
      if (!this.isChildAlive()) {
        this.restartChild();
      }
      const request = `${JSON.stringify(anyRequest)}\n`;
      this.proc?.stdin?.write(request, "utf8");

      return await new Promise((resolve, reject) => {
        this.resolveMap.set(id, resolve);
        setTimeout(() => {
          this.resolveMap.delete(id);
          reject(new Error("Timeout"));
        }, timeToSleep);
      });
    } catch (e) {
      Logger.error(`interacting with tabnine assistant: ${e}`);
      return undefined;
    } finally {
      release();
    }
  }

  get shutdowned(): boolean {
    return this.isShutdown;
  }

  set shutdowned(value: boolean) {
    this.isShutdown = value;
  }

  private isChildAlive(): boolean {
    return !!this.proc && !this.childDead;
  }

  private onChildDeath() {
    this.childDead = true;

    setTimeout(() => {
      if (!this.isChildAlive()) {
        this.restartChild();
      }
    }, 10000);
  }

  private restartChild<R>(): void {
    if (this.numRestarts >= 10) {
      return;
    }
    this.numRestarts += 1;
    if (this.proc) {
      this.proc.kill();
    }
    this.proc = run();
    this.childDead = false;
    this.proc.on("exit", () => {
      if (!this.shutdowned) {
        this.onChildDeath();
      }
    });
    this.proc.stdin?.on("error", (error) => {
      Logger.error(`assistant binary stdin error: ${error.message}`);
      this.onChildDeath();
    });
    this.proc.stdout?.on("error", (error) => {
      Logger.error(`assistant binary stdout error: ${error.message}`);
      this.onChildDeath();
    });
    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.rl = readline.createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin,
    } as readline.ReadLineOptions);
    this.rl.on("line", (line) => {
      const result = JSON.parse(line) as { id: number; body: R };
      const { id } = result;
      const { body } = result;
      const resolve = this.resolveMap.get(id) as (data: R) => void | undefined;
      if (resolve) {
        resolve(body);
        this.resolveMap.delete(id);
      }
    });
  }
}
