import HttpsProxyAgent from "https-proxy-agent/dist/agent";
import * as url from "url";
import { workspace } from "vscode";

type ProxyAgentSettings = {
  agent: HttpsProxyAgent | undefined;
  rejectUnauthorized: boolean;
};
export default function getHttpsProxyAgent(): ProxyAgentSettings {
  const proxySettings = getProxySettings();

  if (!proxySettings) {
    return { agent: undefined, rejectUnauthorized: false };
  }

  const proxyUrl = url.parse(proxySettings);
  if (proxyUrl.protocol !== "https:" && proxyUrl.protocol !== "http:") {
    return { agent: undefined, rejectUnauthorized: false };
  }

  const rejectUnauthorized = workspace
    .getConfiguration()
    .get("http.proxyStrictSSL", true);

  const parsedPort: number | undefined = proxyUrl.port
    ? parseInt(proxyUrl.port, 10)
    : undefined;
  const port = Number.isNaN(parsedPort) ? undefined : parsedPort;

  const proxyOptions = {
    host: proxyUrl.hostname,
    port,
    auth: proxyUrl.auth,
    rejectUnauthorized,
  };

  return {
    agent: new HttpsProxyAgent(proxyOptions),
    rejectUnauthorized,
  };
}

function getProxySettings(): string | undefined {
  let proxy: string | undefined = workspace
    .getConfiguration()
    .get<string>("http.proxy");
  if (!proxy) {
    proxy =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;
  }
  return proxy;
}
