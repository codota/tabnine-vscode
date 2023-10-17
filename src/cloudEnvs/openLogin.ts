import { env } from "vscode";
import { asExternal } from "../utils/asExternal";
import { startLoginServer } from "../binary/requests/startLoginServer";

export async function openExternalLogin(): Promise<void> {
  const url = await startLoginServer();
  if (!url) {
    return;
  }
  const remapedUrl = await asExternal(url);

  void env.openExternal(remapedUrl);
}
