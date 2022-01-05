import { promises as fs } from "fs";
import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import showMessage from "../preRelease/messages";

const EXTENSION_ID = "TabNine.tabnine-vscode";

export default async function enableProposed(): Promise<boolean> {
  return handleProposed().catch(() => false);
}

async function getDataFolderName(): Promise<string | undefined> {
  const productFilePath = path.join(vscode.env.appRoot, "product.json");

  const data = await fs.readFile(productFilePath);
  const file = JSON.parse(data.toString("utf8")) as {
    dataFolderName?: string;
  };
  return file?.dataFolderName;
}

function getArgvResource(dataFolderName: string): string {
  const vscodePortable = process.env.VSCODE_PORTABLE;
  if (vscodePortable) {
    return path.join(vscodePortable, "argv.json");
  }

  return path.join(os.homedir(), dataFolderName, "argv.json");
}
const ENABLE_PROPOSED_API = [
  "",
  `	"enable-proposed-api": ["${EXTENSION_ID}"]`,
  "}",
];
async function handleProposed(): Promise<boolean> {
  const dataFolderName = await getDataFolderName();

  if (dataFolderName) {
    const argvResource = getArgvResource(dataFolderName);
    const argvString = (await fs.readFile(argvResource)).toString();

    if (argvString.includes(`${EXTENSION_ID}`)) {
      return true;
    }

    const newArgvString = argvString
      .substring(0, argvString.length - 2)
      .concat(",\n", ENABLE_PROPOSED_API.join("\n"));
    await fs.writeFile(argvResource, Buffer.from(newArgvString));
    void showMessage({
      messageId: "inline-update",
      messageText: `Please reload the window for the Tabnine inline completions to take effect.`,
      buttonText: "Reload",
      action: () =>
        void vscode.commands.executeCommand("workbench.action.reloadWindow"),
    });
  }
  return false;
}
