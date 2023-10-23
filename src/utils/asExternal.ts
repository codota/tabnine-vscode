import { URL } from "url";
import { Uri } from "vscode";
import {
  TABNINE_RETURN_URL_QUERY_PARAM,
  TABNINE_URL_QUERY_PARAM,
} from "../globals/consts";
import { asExternalUri } from "./asExternalUri";

export async function asExternal(url: string, path?: string) {
  const serviceUrl = new URL(url);

  const tabnineUrl = serviceUrl.searchParams.get(TABNINE_URL_QUERY_PARAM);
  const returnUrl = serviceUrl.searchParams.get(TABNINE_RETURN_URL_QUERY_PARAM);

  if (tabnineUrl) {
    serviceUrl.searchParams.set(
      TABNINE_URL_QUERY_PARAM,
      (await asExternalUri(Uri.parse(tabnineUrl))).toString()
    );
  }

  if (returnUrl) {
    serviceUrl.searchParams.set(
      TABNINE_RETURN_URL_QUERY_PARAM,
      (await asExternalUri(Uri.parse(returnUrl))).toString()
    );
  }

  let parsedUri = Uri.parse(serviceUrl.toString());

  if (path) {
    parsedUri = Uri.joinPath(parsedUri, path);
  }

  return asExternalUri(parsedUri);
}
