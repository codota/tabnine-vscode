import { URL } from "url";
import path from "path";
import { Uri, env } from "vscode";
import { StateType, TABNINE_URL_QUERY_PARAM } from "../globals/consts";
import { configuration } from "../binary/requests/requests";

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
      (await env.asExternalUri(Uri.parse(tabnineUrl))).toString()
    );
  }

  if (hubPath) {
    hubUrl.pathname = path.join(hubUrl.pathname, hubPath);
  }

  return env.asExternalUri(Uri.parse(hubUrl.toString()));
}
