import { URL } from "url";
import { Uri } from "vscode";
import { TABNINE_URL_QUERY_PARAM } from "../globals/consts";
import { asExternalUri } from "./asExternalUri";

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
