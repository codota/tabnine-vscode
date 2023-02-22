import * as child_process from "child_process";
import { spawn, SpawnOptions } from "child_process";
import { createInterface, ReadLine, ReadLineOptions } from "readline";
import * as vscode from "vscode";
import { getTabnineExtensionContext } from "../globals/tabnineExtensionContext";
import { EventName, report } from "../reports/reporter";

export type BinaryProcessRun = {
  proc: child_process.ChildProcess;
  readLine: ReadLine;
};

export function runProcess(
  command: string,
  args?: ReadonlyArray<string>,
  options: SpawnOptions = {}
): BinaryProcessRun {
  if (
    getTabnineExtensionContext()?.extensionMode === vscode.ExtensionMode.Test
  ) {
    // eslint-disable-next-line
    return require("./mockedRunProcess").default() as BinaryProcessRun;
  }
  report(EventName.START_BINARY);
  console.log(
    "spawning binary with command: ",
    command,
    " args: ",
    args?.join(" ")
  );
  const proc = args ? spawn(command, args, options) : spawn(command, options);

  const input = proc.stdout;
  const readLine = createInterface({
    input,
    output: proc.stdin,
  } as ReadLineOptions);

  return { proc, readLine };
}
