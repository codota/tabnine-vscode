import { window } from "vscode";
import { OUTPUT_CHANNEL_NAME } from "./globals/consts";

const outputChannel = window.createOutputChannel(OUTPUT_CHANNEL_NAME);

export function logInput(txt: string, parameters = {}){
    outputChannel.append(`INPUT to API: (with parameters ${JSON.stringify(parameters)}) \n`)
    outputChannel.append(txt);
    outputChannel.append("\n")
}

export function logOutput(txt: string){
    outputChannel.append("OUTPUT from API:\n")
    outputChannel.append(txt);
    outputChannel.append("\n\n");
}

export default outputChannel;