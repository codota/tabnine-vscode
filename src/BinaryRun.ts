import * as child_process from "child_process";
import BinaryVersionFetcher from "./BinaryVersionFetcher";
import BinaryPaths from "./BinaryPaths";
import { tabnineContext } from "./extensionContext";

export default class BinaryRun {
  constructor(private binaryVersionFetcher: BinaryVersionFetcher) {}

  public runTabNine(
    additionalArgs: string[] = [],
    inheritStdio = false
  ): child_process.ChildProcess {
    const args = [
      "--client=vscode",
      "--no-lsp=true",
      tabnineContext.logFilePath
        ? `--log-file-path=${tabnineContext.logFilePath}`
        : null,
      "--client-metadata",
      `clientVersion=${tabnineContext.vscodeVersion}`,
      `pluginVersion=${tabnineContext.version}`,
      `t9-vscode-AutoImportEnabled=${tabnineContext.isTabNineAutoImportEnabled}`,
      `t9-vscode-TSAutoImportEnabled=${tabnineContext.isTypeScriptAutoImports}`,
      `t9-vscode-JSAutoImportEnabled=${tabnineContext.isJavaScriptAutoImports}`,
      `vscode-remote=${tabnineContext.isRemote}`,
      `vscode-remote-name=${tabnineContext.remoteName}`,
      `vscode-extension-kind=${tabnineContext.extensionKind}`,
      ...additionalArgs,
    ].filter(Boolean);
    const command = this.binaryVersionFetcher.fetchBinary();
    // TODO: remove
    console.log(`Running TabNine: ${command} ${args.join(" ")}`);

    return child_process.spawn(command, args, {
      stdio: inheritStdio ? "inherit" : "pipe",
    });
  }
}

export function binaryRunInstance() {
  return new BinaryRun(new BinaryVersionFetcher(new BinaryPaths()));
}
