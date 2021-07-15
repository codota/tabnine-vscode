import { exec as execCallback } from "child_process";
import { promisify } from "util";

const exec = promisify(execCallback);

export async function setEnvVar(name: string, value: string): Promise<void> {
  await executeCommand(`env ${name}=${value}`);
}

export default async function executeCommand(
  subCommand: string
): Promise<string> {
  const { stdout, stderr } = await exec(`gp ${subCommand}`);

  if (stderr) {
    throw new Error("gp command returned error");
  }

  return stdout;
}
