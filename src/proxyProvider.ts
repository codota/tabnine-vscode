import {
  HttpsProxyAgent,
  HttpsProxyAgentOptions,
} from "https-proxy-agent/dist";
import { URL } from "url";
import { workspace } from "vscode";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";

type ProxyAgentOptions = {
  ignoreCertificateErrors?: boolean;
  ca: Buffer | undefined;
};

export default function getHttpsProxyAgent(
  options: ProxyAgentOptions
): HttpsProxyAgent | undefined {
  const proxySettings = getProxySettings();

  if (!proxySettings || !tabnineExtensionProperties.useProxySupport) {
    return undefined;
  }

  const proxyUrl = new URL(proxySettings);

  const proxyOptions: HttpsProxyAgentOptions = {
    protocol: proxyUrl.protocol,
    port: proxyUrl.port,
    hostname: proxyUrl.hostname,
    pathname: proxyUrl.pathname,
    ca: options.ca,
    rejectUnauthorized: !options.ignoreCertificateErrors,
  };

  try {
    return new HttpsProxyAgent(proxyOptions);
  } catch (e) {
    return undefined;
  }
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
  if (proxy?.endsWith("/")) {
    proxy = proxy.substr(0, proxy.length - 1);
  }
  return proxy;
}
