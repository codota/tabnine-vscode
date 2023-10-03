import HttpsProxyAgent from "https-proxy-agent/dist/agent";
import * as url from "url";
import { workspace } from "vscode";

type ProxyAgentOptions = {
  ignoreCertificateErrors?: boolean;
  ca: Buffer | undefined;
};

export default function getHttpsProxyAgent(
  options: ProxyAgentOptions
): HttpsProxyAgent | undefined {
  const proxySettings = getProxySettings();

  if (!proxySettings) {
    return undefined;
  }

  const proxyUrl = url.parse(proxySettings);
  if (proxyUrl.protocol !== "https:" && proxyUrl.protocol !== "http:") {
    return undefined;
  }

  const parsedPort: number | undefined = proxyUrl.port
    ? parseInt(proxyUrl.port, 10)
    : undefined;
  const port = Number.isNaN(parsedPort) ? undefined : parsedPort;

  const proxyOptions = {
    host: proxyUrl.hostname,
    port,
    auth: proxyUrl.auth,
    ca: options.ca,
    rejectUnauthorized: !options.ignoreCertificateErrors,
  };

  return new HttpsProxyAgent(proxyOptions);
}

export function getProxySettings(): string | undefined {
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
