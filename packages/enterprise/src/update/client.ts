import { workspace } from "vscode";
import * as Url from "url";
import axios, { AxiosInstance } from "axios";
import * as http from "http";
import * as https from "https";

function proxyUrl(): string | undefined {
  return (
    workspace.getConfiguration().get<string>("http.proxy") ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy
  );
}

function noProxy(selfHostedServerUrl: string): boolean {
  const { hostname: tabnineSelfHostedServerHost } = Url.parse(
    selfHostedServerUrl
  );
  const noProxyEnvVar = process.env.no_proxy || process.env.NO_PROXY;

  if (noProxyEnvVar) {
    const noProxyList = noProxyEnvVar.split(",");
    return noProxyList.some(
      (noProxyUrl) => noProxyUrl.trim() === tabnineSelfHostedServerHost
    );
  }

  return false;
}

async function healthy(instance: AxiosInstance): Promise<boolean> {
  try {
    const { status } = await instance.get("/health");
    return status === 200;
  } catch (e) {
    return false;
  }
}

export default async function client(
  selfHostedServerUrl: string
): Promise<AxiosInstance> {
  const axiosClient = axios.create({
    baseURL: selfHostedServerUrl,
    httpAgent: new http.Agent(),
    httpsAgent: new https.Agent(),
    proxy: false,
  });
  const url = proxyUrl();
  if (!url) {
    return axiosClient;
  }

  const { hostname: host, protocol, port } = Url.parse(url);
  if (!host || !protocol || !port || noProxy(selfHostedServerUrl)) {
    return axiosClient;
  }

  const axiosClientWithProxy = axios.create({
    baseURL: selfHostedServerUrl,
    httpAgent: new http.Agent(),
    httpsAgent: new https.Agent(),
    proxy: { host, protocol, port: parseInt(port, 10) },
  });

  if (await healthy(axiosClientWithProxy)) {
    return axiosClientWithProxy;
  }

  return axiosClient;
}
