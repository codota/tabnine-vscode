import * as https from "https";
import { ClientRequest, IncomingMessage } from "http";
import * as fs from "fs";
import * as url from "url";
import getHttpsProxyAgent from "./proxyProvider";

export function downloadFileToStr(urlStr: string): Promise<string> {
  return downloadResource(urlStr, (response, resolve) => {
    let downloadedData = "";
    response.on("data", (data) => {
      downloadedData += data;
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
  return downloadResource(urlStr, (response, resolve) => {
    const createdFile: fs.WriteStream = fs.createWriteStream(destinationPath);
    createdFile.on("finish", () => {
      resolve();
    });
    response.pipe(createdFile);
  });
}

export function downloadResource<T>(
  urlStr: string,
  callback: (
    response: IncomingMessage,
    resolve: (value: T | PromiseLike<T>) => void
  ) => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const parsedUrl = url.parse(urlStr);
    const { agent, rejectUnauthorized } = getHttpsProxyAgent();
    const request: ClientRequest = https.request(
      {
        host: parsedUrl.host,
        path: parsedUrl.path,
        agent,
        rejectUnauthorized,
        headers: { "User-Agent": "TabNine.tabnine-vscode" },
      },
      (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
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
          return reject();
        }
        callback(response, resolve);
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
