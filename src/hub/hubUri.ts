import { URL } from "url";
import { Uri, env } from "vscode";
import {
  StateType,
  TABNINE_URL_QUERY_PARAM,
  LOCAL_ADDRESSES,
} from "../globals/consts";
import { configuration } from "../binary/requests/requests";
import {
  asExternalUri as asCodeServerExternalUri,
  isCodeServer,
} from "../cloudEnvs/codeServer";

let asExternalUri = async (uri: Uri): Promise<Uri> => {
  if (!LOCAL_ADDRESSES.includes(new URL(uri.toString()).hostname)) return uri;
  if (isCodeServer) {
    return asCodeServerExternalUri(uri);
  }

  return env.asExternalUri(uri);
};

export function setAsExternalUri(fn: typeof asExternalUri): void {
  asExternalUri = fn;
}

export default async function hubUri(
  type: StateType,
  hubPath?: string
): Promise<Uri | null> {
  const config = await configuration({ quiet: true, source: type });
  if (!config?.message) {
    return null;
  }

  const hubUrl = new URL(config.message);

  const tabnineUrl = hubUrl.searchParams.get(TABNINE_URL_QUERY_PARAM);
  if (tabnineUrl) {
    hubUrl.searchParams.set(
      TABNINE_URL_QUERY_PARAM,
      (await asExternalUri(Uri.parse(tabnineUrl))).toString()
    );
  }

  let parsedHubUri = Uri.parse(hubUrl.toString());

  if (hubPath) {
    parsedHubUri = Uri.joinPath(parsedHubUri, hubPath);
  }

  return asExternalUri(parsedHubUri);
}
