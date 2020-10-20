import { Mutex } from "await-semaphore";
import * as child_process from "child_process";
import * as readline from "readline";
import * as vscode from "vscode";
import { setState } from "../binary/requests";
import { Capability, isCapabilityEnabled } from "../capabilities";
import { StatePayload } from "../consts";
import { CancellationToken } from "./cancellationToken";
import {
  VALIDATOR_CLEAR_CACHE_COMMAND,
  VALIDATOR_IGNORE_COMMAND,
  VALIDATOR_SELECTION_COMMAND,
  VALIDATOR_TOGGLE_COMMAND,
} from "./commands";
import { registerValidator } from "./diagnostics";
import {
  downloadValidatorBinary,
  getFullPathToValidatorBinary,
  getNanoSecTime,
  StateType,
} from "./utils";
import {
  validatorClearCacheHandler,
  validatorIgnoreHandler,
  validatorSelectionHandler,
} from "./ValidatorHandlers";
import { setValidatorMode, ValidatorMode } from "./ValidatorMode";

const ACTIVE_STATE_KEY = "tabnine-validator-active";
const ENABLED_KEY = "tabnine-validator:enabled";
const BACKGROUND_KEY = "tabnine-validator:background";
const CAPABILITY_KEY = "tabnine-validator:capability";
export const VALIDATOR_API_VERSION = "1.0.0";
export let VALIDATOR_BINARY_VERSION = "";
const MODE_A = "A";
const MODE_B = "B";
let MODE = MODE_A;

function getMode(): string {
  if (isCapabilityEnabled(Capability.VALIDATOR_MODE_A_CAPABILITY_KEY)) {
    return MODE_A;
  } else if (isCapabilityEnabled(Capability.VALIDATOR_MODE_B_CAPABILITY_KEY)) {
    return MODE_B;
  }
  return MODE_A; // default
}

export function initValidator(
  context: vscode.ExtensionContext,
  pasteDisposable: vscode.Disposable
) {
  vscode.commands.executeCommand("setContext", CAPABILITY_KEY, true);
  MODE = getMode();

  setValidatorMode(ValidatorMode.Background);
  let backgroundMode = true;

  if (isCapabilityEnabled(Capability.VALIDATOR_BACKGROUND_CAPABILITY)) {
    // use default values
  } else if (isCapabilityEnabled(Capability.VALIDATOR_PASTE_CAPABILITY)) {
    backgroundMode = false;
    setValidatorMode(ValidatorMode.Paste);
  }
  vscode.commands.executeCommand("setContext", BACKGROUND_KEY, backgroundMode);

  let isActive = context.globalState.get(ACTIVE_STATE_KEY, backgroundMode);
  if (isActive === null || typeof isActive === "undefined") {
    isActive = true;
  }
  context.subscriptions.push(
    vscode.commands.registerCommand(VALIDATOR_TOGGLE_COMMAND, async () => {
      const value = !isActive ? "On" : "Off";
      const message = `Please reload Visual Studio Code to turn Validator ${value}.`;
      const reload = await vscode.window.showInformationMessage(
        message,
        "Reload Now"
      );
      if (reload) {
        setState({
          [StatePayload.STATE]: { state_type: StateType.toggle, state: value },
        });
        await context.globalState.update(ACTIVE_STATE_KEY, !isActive);
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    })
  );

  if (isActive) {
    downloadValidatorBinary()
      .then((isTabNineValidatorBinaryDownloaded) => {
        if (isTabNineValidatorBinaryDownloaded) {
          pasteDisposable.dispose();
          registerValidator(context, pasteDisposable);

          context.subscriptions.push(
            vscode.commands.registerTextEditorCommand(
              VALIDATOR_SELECTION_COMMAND,
              validatorSelectionHandler
            )
          );
          context.subscriptions.push(
            vscode.commands.registerTextEditorCommand(
              VALIDATOR_IGNORE_COMMAND,
              validatorIgnoreHandler
            )
          );
          if (backgroundMode) {
            context.subscriptions.push(
              vscode.commands.registerCommand(
                VALIDATOR_CLEAR_CACHE_COMMAND,
                validatorClearCacheHandler
              )
            );
          }
          vscode.commands.executeCommand("setContext", ENABLED_KEY, true);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

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
): Promise<string> {
  if (validationProcess === null) {
    validationProcess = new ValidatorProcess();
    if (validationProcess) {
      const _body = {
        method: "get_version",
        params: {},
      };
      VALIDATOR_BINARY_VERSION = await request(_body);
    }
  }

  if (validationProcess.shutdowned) {
    return;
  }

  return new Promise((resolve, reject) => {
    const id = getNanoSecTime();

    validationProcess
      .post({ ...body, id, version: VALIDATOR_API_VERSION }, id)
      .then(resolve, reject);
    cancellationToken?.registerCallback(reject, "Canceled");
    setTimeout(() => {
      reject("Timeout");
    }, timeToSleep);
  });
}

export function getValidatorDiagnostics(
  code: string,
  fileName: string,
  visibleRange: Range,
  threshold: string,
  editDistance: number,
  apiKey: string,
  cancellationToken: CancellationToken
): Promise<ValidatorDiagnostic[]> {
  const body = {
    method: "get_validator_diagnostics",
    params: {
      code: code,
      fileName: fileName,
      visibleRange: visibleRange,
      mode: MODE,
      threshold: threshold,
      editDistance: editDistance,
      apiKey: apiKey,
    },
  };
  return request(body, cancellationToken) as Promise<ValidatorDiagnostic[]>;
}

export function getValidExtensions(): Promise<string[]> {
  const method = "get_valid_extensions";
  const body = {
    method: method,
    params: {},
  };
  return request(body) as Promise<string[]>;
}

export function getValidLanguages(): Promise<string[]> {
  const method = "get_valid_languages";
  const body = {
    method: method,
    params: {},
  };
  return request(body) as Promise<string[]>;
}

export function getCompilerDiagnostics(code, fileName): Promise<string[]> {
  const method = "get_compiler_diagnostics";
  const body = {
    method: method,
    params: {
      code: code,
      fileName: fileName,
    },
  };
  return request(body) as Promise<string[]>;
}

export function clearCache(): Promise<string[]> {
  const method = "clear_cache";
  const body = {
    method: method,
    params: {},
  };

  return request(body) as Promise<string[]>;
}

export function setIgnore(responseId: string): Promise<string[]> {
  const method = "set_ignore";
  const body = {
    method: method,
    params: {
      responseId: responseId,
    },
  };
  return request(body) as Promise<string[]>;
}

export function closeValidator(): Promise<unknown> {
  console.log("Validator is closing");
  if (validationProcess) {
    const method = "shutdown";
    const body = {
      method: method,
      params: {},
    };
    validationProcess.shutdowned = true;
    return request(body);
  }
  return Promise.resolve();
}

class ValidatorProcess {
  private proc: child_process.ChildProcess;
  private rl: readline.ReadLine;
  private numRestarts: number = 0;
  private childDead: boolean;
  private mutex: Mutex = new Mutex();
  private resolveMap: Map<number, any> = new Map();
  private _shutdowned = false;

  constructor() {
    this.restartChild();
  }

  async post(any_request: any, id: number): Promise<any> {
    const release = await this.mutex.acquire();
    try {
      if (!this.isChildAlive()) {
        this.restartChild();
      }
      const request = JSON.stringify(any_request) + "\n";
      this.proc.stdin.write(request, "utf8");

      return new Promise((resolve) => {
        this.resolveMap.set(id, resolve);
      });
    } catch (e) {
      console.log(`Error interacting with TabNine Validator: ${e}`);
    } finally {
      release();
    }
  }

  get shutdowned() {
    return this._shutdowned;
  }
  set shutdowned(value: boolean) {
    this._shutdowned = value;
  }

  private isChildAlive(): boolean {
    return this.proc && !this.childDead;
  }

  protected run(
    additionalArgs: string[] = [],
    inheritStdio: boolean = false
  ): child_process.ChildProcess {
    const args = [...additionalArgs];
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
      if (!this.shutdowned) {
        this.onChildDeath();
      }
    });
    this.proc.stdin.on("error", (error) => {
      console.log(`validator binary stdin error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stdout.on("error", (error) => {
      console.log(`validator binary stdout error: ${error}`);
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
