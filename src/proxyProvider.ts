import HttpsProxyAgent from "https-proxy-agent/dist/agent";
import { getSystemProxy } from "os-proxy-config";
import * as url from "url";
import { workspace } from "vscode";

export type ProxyAgentSettings = {
  agent: HttpsProxyAgent | undefined;
  rejectUnauthorized: boolean;
};

export const proxyUrl = getProxySettings();

export default async function getHttpsProxyAgent(): Promise<ProxyAgentSettings> {
  const proxySettings = await proxyUrl;

  if (!proxySettings) {
    return { agent: undefined, rejectUnauthorized: false };
  }

  const { protocol } = url.parse(proxySettings);
  if (protocol !== "https:" && protocol !== "http:") {
    return { agent: undefined, rejectUnauthorized: false };
  }

  const rejectUnauthorized = workspace
    .getConfiguration()
    .get("http.proxyStrictSSL", true);

  const proxyOptions = {
    ...url.parse(proxySettings),
    rejectUnauthorized,
  };

  return {
    agent: new HttpsProxyAgent(proxyOptions),
    rejectUnauthorized,
  };
}

async function getProxySettings(): Promise<string | undefined> {
  let proxy: string | undefined = workspace
    .getConfiguration()
    .get<string>("http.proxy");
  if (!proxy) {
    const system = await getSystemProxy();
    proxy = system?.proxyUrl;
  }
  return proxy;
}
