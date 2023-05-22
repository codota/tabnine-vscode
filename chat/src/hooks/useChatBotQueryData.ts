import { useEditorContext } from "./useEditorContext";
import { useJwt } from "./useJwt";

export type ChatBotQueryData = {
    token: string;
    editorContext: string;
}

export function useChatBotQueryData(): ChatBotQueryData | null {
    const token = useJwt();
    const editorContext = useEditorContext();

    if (!token || !editorContext) {
        return null;
    }

    return {
        token,
        editorContext
    }
}