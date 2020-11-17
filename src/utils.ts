import * as vscode from "vscode";
import * as https from "https";
import { ClientRequest, IncomingMessage } from "http";
import * as tmp from "tmp";
import * as fs from "fs";

export function withPolling(
  callback: (clear: () => void) => void,
  interval: number,
  timeout: number
): void {
  const pollingInterval = setInterval(() => callback(clearPolling), interval);

  const pollingTimeout = setTimeout(() => {
    clearInterval(pollingInterval);
  }, timeout);

  function clearPolling() {
    clearInterval(pollingInterval);
    clearTimeout(pollingTimeout);
  }
}

export async function assertFirstTimeRecieved(
  key: string,
  context: vscode.ExtensionContext
): Promise<string | void> {
  return new Promise((resolve, reject) => {
    if (!context.globalState.get(key)) {
      void context.globalState.update(key, true).then(resolve, reject);
    } else {
      reject(new Error("Already happened"));
    }
  });
}

export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
export function downloadFileToDestination(
  urlStr: string,
  destinationPath: string
): Promise<void> {
    return downloadResource(urlStr, (response, resolve) => {
      const createdFile: fs.WriteStream = fs.createWriteStream(
        destinationPath
      );
      createdFile.on("finish", () => {
        resolve();
      });
      response.pipe(createdFile);
    });
}

export function downloadFileToStr(urlStr: string): Promise<string> {
  return downloadResource(urlStr, (response, resolve) => {
    let downloadedData = "";
      response.on("data", (data) => {
        downloadedData += data;
      });
      response.on("end", () => {
        resolve(downloadedData);
      });
  })
}
export function createTempFileWithPostfix(postfix: string): Promise<tmp.FileResult> {
  return new Promise<tmp.FileResult>((resolve, reject) => {
    tmp.file({ postfix }, (err, path, fd, cleanupCallback) => {
      console.log("mock file,", path);
      if (err) {
        return reject(err);
      }
      return resolve(<tmp.FileResult>{
        name: path,
        fd,
        removeCallback: cleanupCallback,
      });
    });
  });
}

export function downloadResource<T>(urlStr: string, callback: (response: IncomingMessage, resolve: (value: T | PromiseLike<T>) => void) => void ): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const request: ClientRequest = https.request(urlStr, (response) => {
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
      if (response.statusCode !== 200) {
        // If request is not successful
        return reject();
      }
      callback(response, resolve);
      response.on("error", (error) => {
        reject(error);
      });
      return undefined;
    });
    request.on("error", (error) => {
      reject(error);
    });
    request.end();
  });
}