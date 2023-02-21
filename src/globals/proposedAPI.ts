import { promises as fs } from "fs";
import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

const EXTENSION_ID = "TabNine.tabnine-vscode";
const ARGV_FILE_NAME = "argv.json";
const PRODUCT_FILE_NAME = "product.json";
const PRODUCT_FILE_PATH = path.join(vscode.env.appRoot, PRODUCT_FILE_NAME);
const ENABLE_PROPOSED_API = [
  "",
  `	"enable-proposed-api": ["${EXTENSION_ID}"]`,
  "}",
];

export default async function enableProposed(): Promise<boolean> {
  return handleProposed().catch((error) => {
    console.error("failed to enable proposedAPI", error);
    return false;
  });
}

async function getDataFolderName(): Promise<string | undefined> {
  const data = await fs.readFile(PRODUCT_FILE_PATH);
  const file = JSON.parse(data.toString("utf8")) as {
    dataFolderName?: string;
  };
  return file?.dataFolderName;
}

function getArgvResource(dataFolderName: string): string {
  const vscodePortable = process.env.VSCODE_PORTABLE;
  if (vscodePortable) {
    return path.join(vscodePortable, ARGV_FILE_NAME);
  }

  return path.join(os.homedir(), dataFolderName, ARGV_FILE_NAME);
}
async function handleProposed(): Promise<boolean> {
  const dataFolderName = await getDataFolderName();

  if (dataFolderName) {
    const argvResource = getArgvResource(dataFolderName);
    const argvString = (await fs.readFile(argvResource)).toString();

    if (argvString.includes(`${EXTENSION_ID}`)) {
      return true;
    }

    const modifiedArgvString = modifyArgvFileContent(argvString);
    await fs.writeFile(argvResource, Buffer.from(modifiedArgvString));
    askForReload();
  }
  return false;
}

function askForReload() {
  // todo
}

function modifyArgvFileContent(argvString: string) {
  return argvString
    .substring(0, argvString.length - 2)
    .concat(",\n", ENABLE_PROPOSED_API.join("\n"));
}
