import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import getHttpsProxyAgent from "../proxyProvider";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import { Logger } from "./logger";

export function createClient(config?: AxiosRequestConfig): AxiosInstance {
  const { ignoreCertificateErrors, caCerts } = tabnineExtensionProperties;
  const ca = caCerts ? readCaCertsSync(caCerts) : undefined;
  const agent = getHttpsProxyAgent({ ignoreCertificateErrors, ca });
  return axios.create({
    ...config,
    // eslint-disable-next-line no-any
    headers: { ...config?.headers, "User-Agent": "TabNine.tabnine-vscode" },
    httpAgent: tabnineExtensionProperties.useProxySupport
      ? agent
      : new http.Agent(),
    httpsAgent: tabnineExtensionProperties.useProxySupport
      ? agent
      : new https.Agent(),
  });
}

export async function downloadUrl(client: AxiosInstance, url: string, toPath: string): Promise<void> {
  const writer = fs.createWriteStream(toPath);

  const response = (await client({
    url,
    method: "GET",
    responseType: "stream",
  })) as AxiosResponse<fs.WriteStream>;

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

export function readCaCertsSync(caCertsFileName: string): Buffer | undefined {
  try {
    if (!caCertsFileName) {
      return undefined;
    }
    return fs.readFileSync(caCertsFileName);
  } catch (error) {
    Logger.warn("Failed to read CA certs file", error);
    return undefined;
  }
}
