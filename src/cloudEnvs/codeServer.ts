import { Uri, env } from "vscode";

const { VSCODE_PROXY_URI: vscodeProxyUri } = process.env;

export const isCodeServer = !!vscodeProxyUri;

export async function asExternalUri(uri: Uri): Promise<Uri> {
  return Uri.joinPath(await env.asExternalUri(uri), uri.path);
}
