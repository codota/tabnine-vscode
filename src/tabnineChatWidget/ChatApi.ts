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
  highlightedText: string;
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
      command: "send_jwt",
      payload: {
        token: state.access_token,
      },
    };
  });

  chatEventRegistry.registerEvent<SendEventRequest, void>(
    "send_event",
    async (req: SendEventRequest) => {
      sendEvent({
        name: req.eventName,
        properties: req.properties,
      });
      return {
        command: "success",
      };
    }
  );

  chatEventRegistry.registerEvent<void, EditorContextResponse>(
    "get_editor_context",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return {
          command: "get_editor_context",
          payload: {
            fileText: "",
            highlightedText: "",
          },
        };
      }
      const doc = editor.document;
      const fileText = doc.getText();
      const selection = editor.selection;
      const highlightedText = doc.getText(selection);
      return {
        command: "get_editor_context",
        payload: {
          fileText,
          highlightedText,
        },
      };
    }
  );
}
