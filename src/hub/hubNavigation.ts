import { env, Uri } from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import openHub from "./openHub";



async function open(view: string) : Promise<void> {
    const config = await configuration({ quiet: true, source: StateType.PALLETTE });
    if (config && config.message) {
      const localUri = await env.asExternalUri(Uri.parse(`${config.message  }#${  view}`));
      void openHub(localUri);
    }
}
export function home() : void {
    void open("home");
}
export function status() : void {
    void open("status");
}
export function preferences() : void {
    void open("preferences");
}
export function info() : void {
    void open("installation-info");
}