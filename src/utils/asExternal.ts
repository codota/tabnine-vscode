import { URL } from "url";
import { Uri, env } from "vscode";
import { LOCAL_ADDRESSES, TABNINE_URL_QUERY_PARAM } from "../globals/consts";
import {
  asExternalUri as asCodeServerExternalUri,
  isCodeServer,
} from "../cloudEnvs/codeServer";

export async function asExternalUri(uri: Uri): Promise<Uri> {
  if (!LOCAL_ADDRESSES.includes(new URL(uri.toString()).hostname)) return uri;
  if (isCodeServer) {
    return asCodeServerExternalUri(uri);
  }

  return env.asExternalUri(uri);
}

export async function asExternal(url: string, path?: string) {
  const serviceUrl = new URL(url);

  const tabnineUrl = serviceUrl.searchParams.get(TABNINE_URL_QUERY_PARAM);
  if (tabnineUrl) {
    serviceUrl.searchParams.set(
      TABNINE_URL_QUERY_PARAM,
      (await asExternalUri(Uri.parse(tabnineUrl))).toString()
    );
  }

  let parsedUri = Uri.parse(serviceUrl.toString());

  if (path) {
    parsedUri = Uri.joinPath(parsedUri, path);
  }

  return asExternalUri(parsedUri);
}
