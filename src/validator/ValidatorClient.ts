import * as child_process from "child_process";
import * as readline from "readline";
import { Mutex } from "await-semaphore";
import { CancellationToken } from "./cancellationToken";
import {
  getNanoSecTime,
  getFullPathToValidatorBinary,
  validatorCachePath,
} from "./utils";

export interface Range {
  start: number;
  end: number;
}

export interface ValidatorDiagnostic {
  range: Range;
  completionList: Completion[];
  reference: string;
  currentLine: number;
  references: Range[]; // refrences in the given visibleRange
  responseId: string;
}

export interface Completion {
  value: string;
  score: number;
}

let validationProcess: ValidatorProcess = null;
async function request(
  body,
  cancellationToken?: CancellationToken,
  timeToSleep: number = 10000
) {
  if (validationProcess === null) {
    validationProcess = new ValidatorProcess();
  }
  const id = getNanoSecTime();
  body["id"] = id;
  const responsePromise: Promise<any> = await validationProcess.post(body, id);
  const promises = [
    responsePromise,
    new Promise((resolve) => {
      cancellationToken?.registerCallback(resolve, null);
    }),
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, timeToSleep);
    }),
  ];
  return Promise.race(promises);
}

export function getValidatorDiagnostics(
  code: string,
  fileName: string,
  visibleRange: Range,
  threshold: number,
  editDistance: number,
  apiKey: string,
  cancellationToken: CancellationToken
): Promise<ValidatorDiagnostic[]> {
  const method = "get_validator_diagnostics";
  const body = {
    method: method,
    code: code,
    fileName: fileName,
    visibleRange: visibleRange,
    threshold: threshold,
    editDistance: editDistance,
    apiKey: apiKey,
  };
  return request(body, cancellationToken) as Promise<ValidatorDiagnostic[]>;
}

export function getValidExtensions(): Promise<string[]> {
  const method = "get_valid_extensions";
  const body = {
    method: method,
  };
  return request(body) as Promise<string[]>;
}

export function getValidLanguages(): Promise<string[]> {
  const method = "get_valid_languages";
  const body = {
    method: method,
  };
  return request(body) as Promise<string[]>;
}

export function getCompilerDiagnostics(code, fileName): Promise<string[]> {
  const method = "get_compiler_diagnostics";
  const body = {
    method: method,
    code: code,
    fileName: fileName,
  };
  return request(body) as Promise<string[]>;
}

export function clearCache(): Promise<string[]> {
  const method = "clear_cache";
  const body = {
    method: method,
  };
  return request(body) as Promise<string[]>;
}

export function setIgnore(responseId: string): Promise<string[]> {
  const method = "set_ignore";
  const body = {
    method: method,
    responseId: responseId,
  };
  return request(body) as Promise<string[]>;
}

class ValidatorProcess {
  private proc: child_process.ChildProcess;
  private rl: readline.ReadLine;
  private numRestarts: number = 0;
  private childDead: boolean;
  private mutex: Mutex = new Mutex();
  private resolveMap: Map<number, any> = new Map();

  constructor() {
    this.restartChild();
  }

  async post(any_request: any, id: number): Promise<Promise<any>> {
    const release = await this.mutex.acquire();
    try {
      if (!this.isChildAlive()) {
        this.restartChild();
      }
      const request = JSON.stringify(any_request) + "\n";
      this.proc.stdin.write(request, "utf8");
      const promise: Promise<any> = new Promise((resolve) => {
        this.resolveMap.set(id, resolve);
      });
      return promise;
    } catch (e) {
      console.log(`Error interacting with TabNineValidator: ${e}`);
    } finally {
      release();
    }
  }

  private isChildAlive(): boolean {
    return this.proc && !this.childDead;
  }

  protected run(
    additionalArgs: string[] = [],
    inheritStdio: boolean = false
  ): child_process.ChildProcess {
    const args = ["--cache-path", validatorCachePath, ...additionalArgs];
    const command = getFullPathToValidatorBinary();
    return child_process.spawn(command, args, {
      stdio: inheritStdio ? "inherit" : "pipe",
    });
  }

  private onChildDeath() {
    this.childDead = true;

    setTimeout(() => {
      if (!this.isChildAlive()) {
        this.restartChild();
      }
    }, 10000);
  }

  private restartChild(): void {
    if (this.numRestarts >= 10) {
      return;
    }
    this.numRestarts += 1;
    if (this.proc) {
      this.proc.kill();
    }
    this.proc = this.run();
    this.childDead = false;
    this.proc.on("exit", (code, signal) => {
      this.onChildDeath();
    });
    this.proc.stdin.on("error", (error) => {
      console.log(`stdin error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stdout.on("error", (error) => {
      console.log(`stdout error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stderr.on("data", (data) => {
      console.log(data.toString().trim());
    });
    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.rl = readline.createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin,
    });
    this.rl.on("line", (line) => {
      const result = JSON.parse(line);
      const id = result["id"];
      const body = result["body"];
      this.resolveMap.get(id)(body);
      this.resolveMap.delete(id);
    });
  }
}
