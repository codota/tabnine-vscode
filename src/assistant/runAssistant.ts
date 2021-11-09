import * as child_process from "child_process";
import { getFullPathToAssistantBinary } from "./utils";

export default function run(
  additionalArgs: string[] = [],
  inheritStdio = false
): child_process.ChildProcess {
  const args = [...additionalArgs];
  const command = getFullPathToAssistantBinary();
  return child_process.spawn(command, args, {
    stdio: inheritStdio ? "inherit" : "pipe",
  });
}
