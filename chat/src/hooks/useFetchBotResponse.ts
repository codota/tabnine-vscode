import { useEffect, useRef, useState } from 'react';
import { ChatMessages } from '../types/ChatTypes';
import { fetchChatResponse } from '../utils/fetchChatResponse';
import { useEditorContext } from './useEditorContext';
import { useJwt } from './useJwt';

type BotResponse = {
    data: string;
    isLoading: boolean;
    error: string | null;
}

export function useFetchBotResponse(chatMessages: ChatMessages): BotResponse {
    const token = useJwt();
    const [editorContext, isEditorContextReady] = useEditorContext();
    const [data, setData] = useState("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isProcessing = useRef(false);

    const chatContext: ChatMessages = [
        {
            isBot: false,
            text: editorContext,
            timestamp: Date.now().toString()
        },
        ...chatMessages
    ]

    useEffect(() => {
        if (!isEditorContextReady) {
            return;
        }
        if (!isProcessing.current) {
            isProcessing.current = true;
            fetchChatResponse(
                chatContext.map((message) => ({
                    text: message.text,
                    by: message.isBot ? "chat" : "user"
                })),
                (text) => setData(oldData => oldData + text),
                () => {
                    setIsLoading(false);
                    isProcessing.current = false;
                },
                setError
            )
        }
    }, [isEditorContextReady]);

    return { data, isLoading, error };
};
