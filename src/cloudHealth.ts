import * as https from "https";
import * as url from "url";
import getHttpsProxyAgent from "./proxyProvider";
import { getPortNumber } from "./utils/download.utils";

export default function cloudHealth(cloudHost: string): Promise<boolean> {
  const parsedUrl = url.parse(cloudHost);
  const { agent, rejectUnauthorized } = getHttpsProxyAgent();
  const request = {
    host: parsedUrl.host,
    path: "/health",
    port: getPortNumber(parsedUrl),
    agent,
    rejectUnauthorized,
    headers: { "User-Agent": "TabNine.tabnine-vscode" },
    timeout: 30_000,
  };

  return new Promise((resolve) => {
    https
      .get(request, () => {
        resolve(true);
      })
      .on("error", () => {
        resolve(false);
      });
  });
}
