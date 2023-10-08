import { Agent, ClientRequest, IncomingMessage } from "http";
import * as https from "https";
import * as fs from "fs";
import { URL } from "url";
import getHttpsProxyAgent from "../proxyProvider";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import { Logger } from "./logger";

export function getHttpAgent(): Agent {
  const {
    ignoreCertificateErrors,
    caCerts,
    useProxySupport,
  } = tabnineExtensionProperties;
  const ca = caCerts ? readCaCertsSync(caCerts) : undefined;
  const proxyAgent = getHttpsProxyAgent({ ignoreCertificateErrors, ca });

  return useProxySupport && proxyAgent
    ? proxyAgent
    : new https.Agent({ ca, rejectUnauthorized: !ignoreCertificateErrors });
}

export function downloadFileToStr(urlStr: string): Promise<string> {
  return downloadResource(urlStr, (response, resolve, reject) => {
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
  urlStr: string,
  destinationPath: string
): Promise<void> {
  return downloadResource(urlStr, (response, resolve, reject) => {
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

function downloadResource<T>(
  urlStr: string,
  callback: (
    response: IncomingMessage,
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (error: Error) => void
  ) => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const request: ClientRequest = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: parsedUrl.pathname,
        path: parsedUrl.pathname,
        agent: getHttpAgent(),
        rejectUnauthorized: !tabnineExtensionProperties.ignoreCertificateErrors,
        ca: tabnineExtensionProperties.caCerts ? readCaCertsSync(tabnineExtensionProperties.caCerts) : undefined,
        headers: { "User-Agent": "TabNine.tabnine-vscode" },
        timeout: 30_000,
      },
      (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 308) {
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

export function getHttpStatusCode(urlStr: string): Promise<number | undefined> {
  return new Promise<number | undefined>((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    https
      .request(
        {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          pathname: parsedUrl.pathname,
          path: parsedUrl.pathname,
          rejectUnauthorized: !tabnineExtensionProperties.ignoreCertificateErrors,
          ca: tabnineExtensionProperties.caCerts ? readCaCertsSync(tabnineExtensionProperties.caCerts) : undefined,
          agent: getHttpAgent(),
          headers: { "User-Agent": "TabNine.tabnine-vscode" },
          timeout: 30_000,
        },
        (response) => {
          resolve(response.statusCode);
          response.on("error", (error) => {
            reject(error);
          });
          return undefined;
        }
      )
      .on("error", (error) => {
        reject(error);
      });
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
