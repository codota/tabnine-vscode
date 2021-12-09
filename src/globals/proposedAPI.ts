import { promises as fs } from "fs";
import * as vscode from "vscode";
import * as path from "path";
import showMessage from "../preRelease/messages";

const EXTENSION_ID = "tabnine.tabnine-vscode";
const API_NAME = "inlineCompletions";

export default async function enableProposed(): Promise<boolean> {
  return handleProposed().catch(() => false);
}

async function handleProposed(): Promise<boolean> {
  const productFilePath = path.join(vscode.env.appRoot, "product.json");

  const data = await fs.readFile(productFilePath);
  const file = JSON.parse(data.toString("utf8")) as {
    extensionEnabledApiProposals?: { [extensionId: string]: string[] };
  };
  if (file) {
    if (file.extensionEnabledApiProposals) {
      if (file.extensionEnabledApiProposals[EXTENSION_ID]) {
        return true;
      }
      file.extensionEnabledApiProposals[EXTENSION_ID] = [API_NAME];
    } else {
      file.extensionEnabledApiProposals = {
        [EXTENSION_ID]: [API_NAME],
      };
    }
    await fs.writeFile(productFilePath, JSON.stringify(file, null, 2));
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
