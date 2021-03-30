import { spawn, SpawnOptions } from "child_process";
import * as child_process from "child_process";
import { createInterface, ReadLine } from "readline";
import { EventName, report } from "../reports/reporter";

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
  report(EventName.START_BINARY);
  const proc = spawn(command, args, options);

  const readLine = createInterface({
    input: proc.stdout,
    output: proc.stdin,
  });

  return { proc, readLine };
}
