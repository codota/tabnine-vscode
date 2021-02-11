import { ReadLine } from "readline";

type Callback = { (line: string): void };

export default class OnceReader {
  private callbackQueue: Callback[] = [];

  constructor(readline: ReadLine) {
    readline.on("line", (line) => {
      const oldestCallback = this.callbackQueue.shift();

      if (!oldestCallback) {
        // TODO: restart process
        throw new Error(
          "Read a response from the engine before a request was written."
        );
      }

      oldestCallback(line);
    });
  }

  read(callback: (line: string) => void): void {
    this.callbackQueue.push(callback);
  }
}
