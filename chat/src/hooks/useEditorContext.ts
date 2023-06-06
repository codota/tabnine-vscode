import { useState, useEffect } from "react";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";

type SelectedCodeUsage = {
  filePath: string;
  code: string;
};

export type EditorContext = {
  fileCode: string;
  selectedCode: string;
  selectedCodeUsages: SelectedCodeUsage[];
};

export function useEditorContext(): EditorContext | null {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );

  useEffect(() => {
    sendRequestToExtension<void, EditorContext>({
      command: "get_editor_context",
    }).then((response) => {
      setEditorContext(response);
    });
  }, []);

  return editorContext;
}
