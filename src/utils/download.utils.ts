import { Agent, ClientRequest, IncomingMessage } from "http";
import * as https from "https";
import * as fs from "fs";
import { URL } from "url";
import getHttpsProxyAgent from "../proxyProvider";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import { Logger } from "./logger";

export async function getHttpAgent(): Promise<Agent> {
  const {
    ignoreCertificateErrors,
    caCerts,
    useProxySupport,
  } = tabnineExtensionProperties;
  const ca = caCerts ? await readCaCerts(caCerts) : undefined;
  const proxyAgent = getHttpsProxyAgent({ ignoreCertificateErrors, ca });

  return useProxySupport && proxyAgent
    ? proxyAgent
    : new https.Agent({ ca, rejectUnauthorized: !ignoreCertificateErrors });
}

export function downloadFileToStr(url: string | URL): Promise<string> {
  return downloadResource(url, (response, resolve, reject) => {
    let downloadedData = "";
    response.on("data", (data) => {
      downloadedData += data;
    });
    response.on("error", (error) => {
      reject(error);
    });
    response.on("end", () => {
      resolve(downloadedData);
    });
  });
}

export function downloadFileToDestination(
  url: string | URL,
  destinationPath: string
): Promise<void> {
  return downloadResource(url, (response, resolve, reject) => {
    const createdFile: fs.WriteStream = fs.createWriteStream(destinationPath);
    createdFile.on("finish", () => {
      resolve();
    });
    response.on("error", (error) => {
      reject(error);
    });
    response.pipe(createdFile);
  });
}

async function downloadResource<T>(
  url: string | URL,
  callback: (
    response: IncomingMessage,
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (error: Error) => void
  ) => void
): Promise<T> {
  const ca = tabnineExtensionProperties.caCerts
    ? await readCaCerts(tabnineExtensionProperties.caCerts)
    : undefined;
  const agent = await getHttpAgent();
  return new Promise<T>((resolve, reject) => {
    const parsedUrl = typeof url === "string" ? new URL(url) : url;
    const request: ClientRequest = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: parsedUrl.pathname,
        path: parsedUrl.pathname,
        agent,
        rejectUnauthorized: !tabnineExtensionProperties.ignoreCertificateErrors,
        ca,
        headers: { "User-Agent": "TabNine.tabnine-vscode" },
        timeout: 30_000,
      },
      (response) => {
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 308
        ) {
          let redirectUrl: string;
          if (typeof response.headers.location === "string") {
            redirectUrl = response.headers.location;
          } else {
            if (!response.headers.location || response.headers.location) {
              return reject(new Error("Invalid download location received"));
            }
            [redirectUrl] = response.headers.location as string[];
          }
          return resolve(downloadResource(redirectUrl, callback));
        }
        if (response.statusCode !== 200 && response.statusCode !== 403) {
          return reject(
            new Error(`Failed request statusCode ${response.statusCode || ""}`)
          );
        }
        callback(response, resolve, reject);
        response.on("error", (error) => {
          reject(error);
        });
        return undefined;
      }
    );
    request.on("error", (error) => {
      reject(error);
    });
    request.end();
  });
}

export function getHttpStatusCode(
  url: string | URL
): Promise<number | undefined> {
  return downloadResource(url, (response, resolve) => {
    resolve(response.statusCode);
  });
}

export async function readCaCerts(
  caCertsFileName: string
): Promise<Buffer | undefined> {
  try {
    if (!caCertsFileName) {
      return undefined;
    }
    return await fs.promises.readFile(caCertsFileName);
  } catch (error) {
    Logger.warn("Failed to read CA certs file", error);
    return undefined;
  }
}
