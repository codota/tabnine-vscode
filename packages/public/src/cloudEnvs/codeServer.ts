import { URL } from "url";
import { Uri } from "vscode";

const { VSCODE_PROXY_URI: vscodeProxyUri } = process.env;

export const isCodeServer = !!vscodeProxyUri;

export function asExternalUri(uri: Uri): Uri {
  if (!vscodeProxyUri) return uri;

  const url = new URL(uri.toString());
  return Uri.joinPath(
    Uri.parse(vscodeProxyUri.replace("{{port}}", url.port)),
    uri.path
  );
}
