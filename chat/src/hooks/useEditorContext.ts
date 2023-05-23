import { useState, useEffect } from 'react';
import { ExtensionMessageEvent } from '../types/MessageEventTypes';
import { vscode } from '../utils/vscodeApi';
import { sendRequestToExtension } from './ExtensionCommunicationProvider';

type EditorContext = {
    fileText: string;
    selectedText: string;
}

export function useEditorContext(): [string, boolean] {
    const [editorContext, setEditorContext] = useState('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        sendRequestToExtension<void, EditorContext>({
            command: 'get_editor_context'
        }).then((response) => {
            setEditorContext(buildEditorContext(response));
            setIsReady(true);
        });
    }, []);

    return [editorContext, isReady];
}

function buildEditorContext(payload?: EditorContext): string {
    if (!payload) {
        return "";
    }
    return `
${getFileCodeContext(payload)}
${getSelectedCodeContext(payload)}
    `;
}

function getFileCodeContext({ fileText }: EditorContext) {
    if (!fileText) {
        return "";
    }
    return `
Given this is the file code: 
\`\`\`
${fileText}
\`\`\`
`;
}

function getSelectedCodeContext({ selectedText }: EditorContext) {
    if (!selectedText) {
        return "";
    }
    return `
Given this is the selected code: 
\`\`\`
${selectedText}
\`\`\`
`;
}
