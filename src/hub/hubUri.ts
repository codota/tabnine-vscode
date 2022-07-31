// import { URL } from "url";
import { Uri, env } from "vscode";
import { StateType /* TABNINE_URL_QUERY_PARAM */ } from "../globals/consts";
import { configuration } from "../binary/requests/requests";

export default async function hubUri(
  type: StateType,
  path?: string
): Promise<Uri | null> {
  const config = await configuration({ quiet: true, source: type });
  if (!config?.message) {
    return null;
  }

  let uri = await env.asExternalUri(Uri.parse(config.message));

  // This is a prepartion for hub extraction
  // const tabnineUrl = hubUrl.searchParams.get(TABNINE_URL_QUERY_PARAM);
  // if (tabnineUrl)
  //   hubUrl.searchParams.set(
  //     TABNINE_URL_QUERY_PARAM,
  //     (await env.asExternalUri(Uri.parse(tabnineUrl))).toString()
  //   );
  // let uri = Uri.parse(hubUrl.toString());
  //
  if (path) uri = Uri.joinPath(uri, path);
  return uri;
}
