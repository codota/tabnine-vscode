import { Mutex } from 'await-semaphore';
import * as child_process from 'child_process';
import * as semver from 'semver';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export class TabNine {
  private proc: child_process.ChildProcess;
  private rl: readline.ReadLine;
  private numRestarts: number = 0;
  private childDead: boolean;
  private mutex: Mutex = new Mutex();

  constructor() {
  }

  async request(version: string, any_request: any): Promise<any> {
    const release = await this.mutex.acquire();
    try {
      return await this.requestUnlocked(version, any_request);
    } finally {
      release();
    }
  }

  private requestUnlocked(version: string, any_request: any): Promise<any> {
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

    let timeout = new Promise((_resolve, reject) => {
      let timeout = setTimeout(() => reject('request timed out'), 1000);

      unregisterFunctions.push(() => clearTimeout(timeout));
    });

    let procExit = new Promise((_resolve, reject) => {
      const onClose = () => reject('Child process exited');
      this.proc.once('exit', onClose);

      unregisterFunctions.push(() => this.proc.removeListener('exit', onClose));
    });

    const unregister = () => {
      unregisterFunctions.forEach(f => f());
    };

    return Promise.race([response, timeout, procExit]).then(value => {
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

  private static runTabNine(inheritStdio : boolean = false, additionalArgs: string[] = []): child_process.ChildProcess {
    const args = [
      "--client=vscode",
      ...additionalArgs
    ];
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
    this.proc = TabNine.runTabNine();
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

  static reportUninstall(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      let proc = this.runTabNine(true, ['--uninstalled']);
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
