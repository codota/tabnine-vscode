import { useState, useEffect } from "react";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";

export type EditorContext = {
  fileText: string;
  selectedText: string;
};

export function useEditorContext(): EditorContext | null {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);

  useEffect(() => {
    sendRequestToExtension<void, EditorContext>({
      command: "get_editor_context",
    }).then((response) => {
      setEditorContext(response);
    });
  }, []);

  return editorContext;
}
