import * as vscode from "vscode";
import { getState } from "../binary/requests/requests";
import { sendEvent } from "../binary/requests/sendEvent";
import { chatEventRegistry } from "./chatEventRegistry";

type GetJwtResponse = {
  token: string;
};

type SendEventRequest = {
  eventName: string;
  properties?: { [key: string]: string };
};

type EditorContextResponse = {
  fileText: string;
  selectedText: string;
};

export function initChatApi() {
  chatEventRegistry.registerEvent<void, GetJwtResponse>("get_jwt", async () => {
    const state = await getState();
    if (!state) {
      throw new Error("state is undefined");
    }
    if (!state.access_token) {
      throw new Error("state has no access token");
    }
    return {
      token: state.access_token,
    };
  });

  chatEventRegistry.registerEvent<SendEventRequest, void>(
    "send_event",
    async (req: SendEventRequest) => {
      sendEvent({
        name: req.eventName,
        properties: req.properties,
      });
    }
  );

  chatEventRegistry.registerEvent<void, EditorContextResponse>(
    "get_editor_context",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return {
          fileText: "",
          selectedText: "",
        };
      }
      const doc = editor.document;
      const fileText = doc.getText();
      const selectedText = doc.getText(editor.selection);
      return {
        fileText,
        selectedText,
      };
    }
  );
}
