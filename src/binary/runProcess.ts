import { spawn, SpawnOptions } from "child_process";
import * as child_process from "child_process";
import { createInterface, ReadLine } from "readline";

export type BinaryProcessRun = {
  proc: child_process.ChildProcess;
  readLine: ReadLine;
};

export function runProcess(
  command: string,
  args?: ReadonlyArray<string>,
  options?: SpawnOptions
): BinaryProcessRun {
  if (process.env.NODE_ENV === "test") {
    // eslint-disable-next-line
    return require("./mockedRunProcess").default() as BinaryProcessRun;
  }

  const proc = spawn(command, args, options);

  const readLine = createInterface({
    input: process.stdout,
    output: process.stdin,
  });

  return { proc, readLine };
}
