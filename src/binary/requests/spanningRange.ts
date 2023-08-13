import * as vscode from "vscode";
import { Logger } from "../../utils/logger";
import { tabNineProcess } from "./requests";

export type Position = {
    line: number;
    column: number;
};

export type SpanningRangeRequest = {
    file: string;
    position: Position;
}

export type Range = {
    start: Position;
    end: Position;
}

export type SpanningRangeResponse = {
    type: "Success" | "Error";
    range?: Range;
    message?: string;
};

export async function getSpanningRange(request: SpanningRangeRequest): Promise<vscode.Range | undefined> {
    const response = await tabNineProcess.request({
        SpanningRange: request
    }) as SpanningRangeResponse;

    if (response.type === "Error") {
        Logger.error(`failed to get spanning range: ${response.message || 'unknown error'}`);
        return undefined;
    }

    if (!response.range) return undefined;

    return toVscodeRange(response.range);
}

function toVscodeRange(range: Range): vscode.Range {
    return new vscode.Range(toVscodePosition(range.start), toVscodePosition(range.end));
}

function toVscodePosition(position: Position): vscode.Position {
    return new vscode.Position(position.line, position.column);
}