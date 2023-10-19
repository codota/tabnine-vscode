import { URL } from "url";
import { Uri, env } from "vscode";
import { LOCAL_ADDRESSES } from "../globals/consts";
import {
  asExternalUri as asCodeServerExternalUri,
  isCodeServer,
} from "../cloudEnvs/codeServer";

export async function asExternalUri(uri: Uri): Promise<Uri> {
  if (!LOCAL_ADDRESSES.includes(new URL(uri.toString()).hostname)) {
    return uri;
  }
  if (isCodeServer) {
    return asCodeServerExternalUri(uri);
  }

  return env.asExternalUri(uri);
}
