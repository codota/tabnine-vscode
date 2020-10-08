import { Mutex } from 'await-semaphore';
import * as child_process from 'child_process';
import * as semver from 'semver';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { TabNineExtensionContext } from "./TabNineExtensionContext";
import { getContext } from './extensionContext';

export const API_VERSION = "2.0.2";

export const StateType = {
  error: "error",
  info: "info",
  progress: "progress",
  status: "status",
  pallette: "pallette",
  notification: "notification",
}

export const StatePayload = {
  message: "Message",
  state: "State",
}

export class TabNine {
  private proc: child_process.ChildProcess;
  private rl: readline.ReadLine;
  private numRestarts: number = 0;
  private childDead: boolean;
  private mutex: Mutex = new Mutex();

  constructor(private context: TabNineExtensionContext) {

  }

  async request(version: string, any_request: any, timeout = 1000): Promise<any> {
    const release = await this.mutex.acquire();
    try {
      return await this.requestUnlocked(version, any_request, timeout);
    } finally {
      release();
    }
  }

  async setState(state){
    return this.request(API_VERSION,{ "SetState": {state_type: state} });
  }
  async getState(filename){
    return this.request(API_VERSION,{ "State": {filename: filename} });
  }
  async deactivate() {
    return this.request(API_VERSION,{ "Deactivate": {} });
  }
  async uninstalling() {
    return this.request(API_VERSION,{ "Uninstalling": {} });
  }
  async getCapabilities() : Promise<{ enabled_features: string[] }> {
    try {
      let result = await this.request(API_VERSION,{ "Features": {} }, 7000);
      if (!result["enabled_features"] || !Array.isArray(result["enabled_features"])){
        console.error("could not get enabled capabilities");
        return { enabled_features: []};
      }
      return result;
    }
    catch (error) {
      console.error(error);
      return { enabled_features: []};
    }
  }

  private requestUnlocked(version: string, any_request: any, timeout = 1000): Promise<any> {
    any_request = {
      "version": version,
      "request": any_request
    };

    const unregisterFunctions = [];

    const request = JSON.stringify(any_request) + '\n';

    let response = new Promise<any>((resolve, reject) => {
      try {
        if (!this.isChildAlive()) {
          this.restartChild();
        }
        if (!this.isChildAlive()) {
          reject(new Error("TabNine process is dead."))
        }
        const onResponse: (input: any) => void = (response) => {
          let any_response: any = JSON.parse(response.toString());
          resolve(any_response);
        };
        this.rl.once('line', onResponse);

        unregisterFunctions.push(() => this.rl.removeListener('line', onResponse));
        this.proc.stdin.write(request, "utf8");
      } catch (e) {
        console.log(`Error interacting with TabNine: ${e}`);
        reject(e);
      }
    });

    let timer = new Promise((_resolve, reject) => {
      let timer = setTimeout(() => reject('request timed out'), timeout);

      unregisterFunctions.push(() => clearTimeout(timer));
    });

    let procExit = new Promise((_resolve, reject) => {
      const onClose = () => reject('Child process exited');
      this.proc.once('exit', onClose);

      unregisterFunctions.push(() => this.proc.removeListener('exit', onClose));
    });

    const unregister = () => {
      unregisterFunctions.forEach(f => f());
    };

    return Promise.race([response, timer, procExit]).then(value => {
      unregister();
      return value;
    }, err => {
      unregister();
      throw err;
    });
  }

  private isChildAlive(): boolean {
    return this.proc && !this.childDead;
  }

  private static runTabNine(context: TabNineExtensionContext, additionalArgs: string[] = [], inheritStdio : boolean = false): child_process.ChildProcess {
    const args = [
      "--client=vscode",
      "--no-lsp=true",
      context?.logFilePath ? `--log-file-path=${context.logFilePath}`: null,
      "--client-metadata",
      `clientVersion=${context?.vscodeVersion}`,
      `pluginVersion=${context?.version}`,
      `t9-vscode-AutoImportEnabled=${context?.isTabNineAutoImportEnabled}`,
      `t9-vscode-TSAutoImportEnabled=${context?.isTypeScriptAutoImports}`,
      `t9-vscode-JSAutoImportEnabled=${context?.isJavaScriptAutoImports}`,
      `vscode-remote=${context?.isRemote}`,
      `vscode-remote-name=${context?.remoteName}`,
      `vscode-extension-kind=${context?.extensionKind}`,
      ...additionalArgs
    ].filter(Boolean);
    const binary_root = path.join(__dirname, "..", "binaries");
    const command = TabNine.getBinaryPath(binary_root);
    return child_process.spawn(command, args, { stdio: inheritStdio ? 'inherit' : 'pipe'});
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
    this.proc = TabNine.runTabNine(this.context, [`ide-restart-counter=${this.numRestarts}`]);
    this.childDead = false;
    this.proc.on('exit', (code, signal) => {
      this.onChildDeath();
    });
    this.proc.stdin.on('error', (error) => {
      console.log(`stdin error: ${error}`);
      this.onChildDeath();
    });
    this.proc.stdout.on('error', (error) => {
      console.log(`stdout error: ${error}`);
      this.onChildDeath();
    });
    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.rl = readline.createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin
    });
  }

  private static getBinaryPath(root): string {
    let arch;
    if (process.arch == 'x32' || process.arch == 'ia32') {
      arch = 'i686'
    } else if (process.arch == 'x64') {
      arch = 'x86_64'
    } else {
      throw new Error(`Sorry, the architecture '${process.arch}' is not supported by TabNine.`)
    }
    let suffix;
    if (process.platform == 'win32') {
      suffix = 'pc-windows-gnu/TabNine.exe'
    } else if (process.platform == 'darwin') {
      suffix = 'apple-darwin/TabNine'
    } else if (process.platform == 'linux') {
      suffix = 'unknown-linux-musl/TabNine'
    }  else {
      throw new Error(`Sorry, the platform '${process.platform}' is not supported by TabNine.`)
    }
    const versions = fs.readdirSync(root)
    TabNine.sortBySemver(versions)
    const tried = []
    for (let version of versions) {
      const full_path = `${root}/${version}/${arch}-${suffix}`
      tried.push(full_path)
      if (fs.existsSync(full_path)) {
        return full_path
      }
    }
    throw new Error(`Couldn't find a TabNine binary (tried the following paths: versions=${versions} ${tried})`)
  }

  private static sortBySemver(versions: string[]) {
    versions.sort(TabNine.cmpSemver);
  }

  private static cmpSemver(a, b): number {
    const a_valid = semver.valid(a)
    const b_valid = semver.valid(b)
    if (a_valid && b_valid) { return semver.rcompare(a, b) }
    else if (a_valid) { return -1 }
    else if (b_valid) { return 1 }
    else if (a < b) { return -1 }
    else if (a > b) { return 1 }
    else { return 0 }
  }


  static reportUninstalled(){
    return TabNine.reportUninstall("--uninstalled");
  }
  static reportUninstalling(context: TabNineExtensionContext){
    return TabNine.reportUninstall("--uninstalling", context);
  }
  private static reportUninstall(uninstallType, context: TabNineExtensionContext = null): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let proc = this.runTabNine(context,[uninstallType], true);
      proc.on('exit', (code, signal) => {
        if (signal) {
          return reject(`TabNine aborted with ${signal} signal`);
        }
        resolve(code);
      });  
      proc.on('error', (err) => {
        reject(err);
      })
    });
  }
}

export const tabNineProcess = new TabNine(getContext());