import * as child_process from 'child_process';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { Mutex } from 'await-semaphore';
import { CancellationToken } from './cancellationToken';


export interface Range {
    start: number;
    end: number;
}

export interface ValidatorDiagnostic {
    range: Range,
    completionList: Completion[],
    reference: string,
    currentLine: number,
    references: Range[] // refrences in the given visibleRange
}

export interface Completion {
    value: string,
    score: number
}

function getNanoSecTime() {
    var hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}

let validationProcess: ValidatorProcess = null;
async function request(body, cancellationToken?: CancellationToken, timeToSleep: number = 10000) {
    if (validationProcess === null) {
        validationProcess = new ValidatorProcess();
    }
    const id = getNanoSecTime();
    body['id'] = id;
    const responsePromise: Promise<any> = await validationProcess.post(body, id);
    const response = await Promise.race([
        responsePromise,
        cancellationToken.getPromise(),
        new Promise(resolve => {
            setTimeout(() => {
                resolve(null);
            }, timeToSleep);
        })
    ]);
    return response;
}

export async function getValidatorDiagnostics(code: string, fileName: string, visibleRange: Range, threshold: number, editDistance: number, cancellationToken): Promise<ValidatorDiagnostic[]> {
    const method = "get_validator_diagnostics";
    const body = {
        method: method,
        code: code,
        fileName: fileName,
        visibleRange: visibleRange,
        threshold: threshold,
        editDistance: editDistance
    };
    return request(body, cancellationToken) as Promise<ValidatorDiagnostic[]> ;
}

export async function getValidExtensions(): Promise<string[]> {
    const method = "get_valid_extensions";
    const body = {
        method: method
    };
    return request(body) as Promise<string[]>;
}

export async function getValidLanguages(): Promise<string[]> {
    const method = "get_valid_languages";
    const body = {
        method: method
    };
    return request(body) as Promise<string[]>;
}

export async function getCompilerDiagnostics(code, fileName): Promise<string[]> {
    const method = "get_compiler_diagnostics";
    const body = {
        method: method,
        code: code,
        fileName: fileName
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
            const request = JSON.stringify(any_request) + '\n';
            this.proc.stdin.write(request, "utf8");
            const promise: Promise<any> = new Promise((resolve, reject) => {
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

    protected run(additionalArgs: string[] = [], inheritStdio: boolean = false): child_process.ChildProcess {
        const args = [
            ...additionalArgs
        ];
        const binary_root = path.join(__dirname, "..", "..", "validator-binaries");
        const command = ValidatorProcess.getBinaryPath(binary_root);
        return child_process.spawn(command, args, { stdio: inheritStdio ? 'inherit' : 'pipe' });
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
        this.proc.stderr.on('data', (data) => {
            console.log(data.toString());
          });
        this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
        this.rl = readline.createInterface({
            input: this.proc.stdout,
            output: this.proc.stdin
        });
        this.rl.on('line', line => {
            const result = JSON.parse(line);
            const id = result['id'];
            const body = result['body'];
            this.resolveMap.get(id)(body);
            this.resolveMap.delete(id);
        });
    }

    protected static getBinaryPath(root): string {
        if (process.arch !== 'x64') {
            throw new Error(`Sorry, the architecture '${process.arch}' is not supported by TabNineValidator.`);
        }
        let suffix;
        if (process.platform == 'win32') {
            suffix = 'tabnine-validator-win.exe';
        } else if (process.platform == 'darwin') {
            suffix = 'tabnine-validator-macos'
        } else if (process.platform == 'linux') {
            suffix = 'tabnine-validator-linux';
        } else {
            throw new Error(`Sorry, the platform '${process.platform}' is not supported by TabNineValidator.`);
        }
        const full_path = `${root}/${suffix}`;
        if (fs.existsSync(full_path)) {
            return full_path;
        }
        throw new Error(`Couldn't find a TabNineValidator binary`);
    }
}

