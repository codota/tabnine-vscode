import { useState, useEffect } from "react";
import { sendRequestToExtension } from "./ExtensionCommunicationProvider";
import hash from "object-hash";
import { useLastEditorContext } from "./useLastEditorContext";

type SelectedCodeUsage = {
  filePath: string;
  code: string;
};

export type EditorContext = {
  fileCode: string;
  selectedCode: string;
  selectedCodeUsages: SelectedCodeUsage[];
};

type Response = {
  editorContext: EditorContext | null;
  isEditorContextChanged: boolean;
};

export function useEditorContext(): Response {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );
  const [isEditorContextChanged, setIsEditorContextChanged] = useState(true);

  const {
    lastEditorContextHash,
    setLastEditorContextHash,
  } = useLastEditorContext();

  useEffect(() => {
    sendRequestToExtension<void, EditorContext>({
      command: "get_editor_context",
    }).then((response) => {
      const currentEditorContextHash = hash(response);
      setIsEditorContextChanged(
        currentEditorContextHash !== lastEditorContextHash
      );
      setLastEditorContextHash(currentEditorContextHash);
      setEditorContext(response);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    editorContext,
    isEditorContextChanged,
  };
}
