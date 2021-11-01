/* eslint-disable */
import { Mutex } from "await-semaphore";
import * as child_process from "child_process";
import * as readline from "readline";
import * as vscode from "vscode";
import setState from "../binary/requests/setState";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { StatePayload } from "../globals/consts";
import CancellationToken from "./CancellationToken";
import {
  ASSISTANT_CLEAR_CACHE_COMMAND,
  ASSISTANT_IGNORE_COMMAND,
  ASSISTANT_SELECTION_COMMAND,
  ASSISTANT_TOGGLE_COMMAND,
} from "./commands";
import { registerAssistant } from "./diagnostics";
import {
  downloadAssistantBinary,
  getFullPathToAssistantBinary,
  getNanoSecTime,
  StateType,
} from "./utils";
import {
  assistantClearCacheHandler,
  assistantIgnoreHandler,
  assistantSelectionHandler,
} from "./AssistantHandlers";
import { setAssistantMode, AssistantMode } from "./AssistantMode";

const ACTIVE_STATE_KEY = "tabnine-assistant-active";
const ENABLED_KEY = "tabnine-assistant:enabled";
const BACKGROUND_KEY = "tabnine-assistant:background";
const CAPABILITY_KEY = "tabnine-assistant:capability";
export const ASSISTANT_API_VERSION = "1.0.0";
export let ASSISTANT_BINARY_VERSION = "";
const MODE_A = "A";
const MODE_B = "B";
let MODE = MODE_A;

function getMode(): string {
  if (isCapabilityEnabled(Capability.ASSISTANT_MODE_A_CAPABILITY_KEY)) {
    return MODE_A;
  }
  if (isCapabilityEnabled(Capability.ASSISTANT_MODE_B_CAPABILITY_KEY)) {
    return MODE_B;
  }
  return MODE_A; // default
}

export function initAssistant(
  context: vscode.ExtensionContext,
  pasteDisposable: vscode.Disposable
): void {
  vscode.commands.executeCommand("setContext", CAPABILITY_KEY, true);
  MODE = getMode();

  setAssistantMode(AssistantMode.Background);
  let backgroundMode = true;

  if (isCapabilityEnabled(Capability.ASSISTANT_BACKGROUND_CAPABILITY)) {
    // use default values
  } else if (isCapabilityEnabled(Capability.ASSISTANT_PASTE_CAPABILITY)) {
    backgroundMode = false;
    setAssistantMode(AssistantMode.Paste);
  }
  vscode.commands.executeCommand("setContext", BACKGROUND_KEY, backgroundMode);

  let isActive = context.globalState.get(ACTIVE_STATE_KEY, backgroundMode);
  if (isActive === null || typeof isActive === "undefined") {
    isActive = true;
  }
  context.subscriptions.push(
    vscode.commands.registerCommand(ASSISTANT_TOGGLE_COMMAND, async () => {
      const value = !isActive ? "On" : "Off";
      const message = `Please reload Visual Studio Code to turn Assistant ${value}.`;
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
    downloadAssistantBinary()
      .then((isTabNineAssistantBinaryDownloaded) => {
        if (isTabNineAssistantBinaryDownloaded) {
          pasteDisposable.dispose();
          registerAssistant(context, pasteDisposable);

          context.subscriptions.push(
            vscode.commands.registerTextEditorCommand(
              ASSISTANT_SELECTION_COMMAND,
              assistantSelectionHandler
            )
          );
          context.subscriptions.push(
            vscode.commands.registerTextEditorCommand(
              ASSISTANT_IGNORE_COMMAND,
              assistantIgnoreHandler
            )
          );
          if (backgroundMode) {
            context.subscriptions.push(
              vscode.commands.registerCommand(
                ASSISTANT_CLEAR_CACHE_COMMAND,
                assistantClearCacheHandler
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

export interface Completion {
  value: string;
  score: number;
  message: string;
}

export interface AssistantDiagnostic {
  range: Range;
  completionList: Completion[];
  reference: string;
  currentLine: number;
  references: Range[]; // refrences in the given visibleRange
  responseId: string;
}

let validationProcess: AssistantProcess | null = null;

async function request(
  body: Record<string, any>,
  cancellationToken?: CancellationToken,
  timeToSleep = 10000
): Promise<any> {
  if (validationProcess === null) {
    validationProcess = new AssistantProcess();
    if (validationProcess) {
      const _body = {
        method: "get_version",
        params: {},
      };
      ASSISTANT_BINARY_VERSION = await request(_body);
    }
  }

  if (validationProcess.shutdowned) {
    return;
  }

  return new Promise((resolve, reject) => {
    const id = getNanoSecTime();

    validationProcess!
      .post({ ...body, id, version: ASSISTANT_API_VERSION }, id)
      .then(resolve, reject);
    cancellationToken?.registerCallback(reject, "Canceled");
    setTimeout(() => {
      reject("Timeout");
    }, timeToSleep);
  });
}

export function getAssistantDiagnostics(
  code: string,
  fileName: string,
  visibleRange: Range,
  threshold: string,
  editDistance: number,
  apiKey: string,
  cancellationToken: CancellationToken
): Promise<AssistantDiagnostic[]> {
  const body = {
    method: "get_assistant_diagnostics",
    params: {
      code,
      fileName,
      visibleRange,
      mode: MODE,
      threshold,
      editDistance,
      apiKey,
    },
  };
  return request(body, cancellationToken) as Promise<AssistantDiagnostic[]>;
}

export function getValidExtensions(): Promise<string[]> {
  const method = "get_valid_extensions";
  const body = {
    method,
    params: {},
  };
  return request(body) as Promise<string[]>;
}

export function getValidLanguages(): Promise<string[]> {
  const method = "get_valid_languages";
  const body = {
    method,
    params: {},
  };
  return request(body) as Promise<string[]>;
}

export function getCompilerDiagnostics(
  code: string,
  fileName: string
): Promise<string[]> {
  const method = "get_compiler_diagnostics";
  const body = {
    method,
    params: {
      code,
      fileName,
    },
  };
  return request(body) as Promise<string[]>;
}

export function clearCache(): Promise<string[]> {
  const method = "clear_cache";
  const body = {
    method,
    params: {},
  };

  return request(body) as Promise<string[]>;
}

export function setIgnore(responseId: string): Promise<string[]> {
  const method = "set_ignore";
  const body = {
    method,
    params: {
      responseId,
    },
  };
  return request(body) as Promise<string[]>;
}

export function closeAssistant(): Promise<unknown> {
  console.log("Assistant is closing");
  if (validationProcess) {
    const method = "shutdown";
    const body = {
      method,
      params: {},
    };
    validationProcess.shutdowned = true;
    return request(body);
  }
  return Promise.resolve();
}

class AssistantProcess {
  private proc?: child_process.ChildProcess;

  private rl?: readline.ReadLine;

  private numRestarts = 0;

  private childDead = false;

  private mutex: Mutex = new Mutex();

  private resolveMap: Map<number, any> = new Map();

  private _shutdowned = false;

  constructor() {
    this.restartChild();
  }

  async post(anyRequest: unknown, id: number): Promise<any> {
    const release = await this.mutex.acquire();

    try {
      if (!this.isChildAlive()) {
        this.restartChild();
      }
      const request = `${JSON.stringify(anyRequest)}\n`;
      this.proc?.stdin?.write(request, "utf8");

      return new Promise((resolve) => {
        this.resolveMap.set(id, resolve);
      });
    } catch (e) {
      console.log(`Error interacting with TabNine Assistant: ${e}`);
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

  private restartChild(): void {
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
      console.log(`assistant binary stdin error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stdout?.on("error", (error) => {
      console.log(`assistant binary stdout error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stderr?.on("data", (data) => {
      console.log(data.toString().trim());
    });
    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.rl = readline.createInterface({
      input: this.proc.stdout!,
      output: this.proc.stdin,
    } as readline.ReadLineOptions);
    this.rl.on("line", (line) => {
      const result = JSON.parse(line);
      const { id } = result;
      const { body } = result;
      this.resolveMap.get(id)(body);
      this.resolveMap.delete(id);
    });
  }
}

function run(
  additionalArgs: string[] = [],
  inheritStdio = false
): child_process.ChildProcess {
  const args = [...additionalArgs];
  const command = getFullPathToAssistantBinary();
  return child_process.spawn(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
  });
}
