import { useState, useEffect } from 'react';
import { ExtensionMessageEvent } from '../types/MessageEventTypes';
import { vscode } from '../utils/vscodeApi';

type EditorContext = {
    fileText: string;
    highlightedText: string;
}

export function useEditorContext(): [string, boolean] {
    const [editorContext, setEditorContext] = useState('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        vscode.postMessage({
            command: 'get_editor_context'
        });

        const handleMessage = (event: ExtensionMessageEvent<EditorContext>) => {
            const message = event.data;
            if (message.command === 'get_editor_context') {
                setEditorContext(buildEditorContextPrompt(message.payload));
                setIsReady(true);
            }
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        }
    }, []);

    return [editorContext, isReady];
}

function buildEditorContextPrompt(payload?: EditorContext): string {
    if (!payload) {
        return "";
    }
    return `
    ${getFileCodePromptText(payload)}
    ${getSelectedCodePromptText(payload)}
    `;
}

function getFileCodePromptText({ fileText }: EditorContext) {
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

function getSelectedCodePromptText({ highlightedText }: EditorContext) {
    if (!highlightedText) {
        return "";
    }
    return `
Given this is the selected code: 
\`\`\`
${highlightedText}
\`\`\`
`;
}