import { useEffect, useRef, useState } from 'react';
import { ChatMessages } from '../types/ChatTypes';
import { fetchChatResponse } from '../utils/fetchChatResponse';
import { ChatBotQueryData } from './useChatBotQueryData';

type BotResponse = {
    data: string;
    isLoading: boolean;
    error: string | null;
}

export function useFetchBotResponse(chatMessages: ChatMessages, chatBotQueryData: ChatBotQueryData): BotResponse {
    const [data, setData] = useState("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isProcessing = useRef(false);

    const chatContext: ChatMessages = [
        {
            isBot: false,
            text: chatBotQueryData.editorContext,
            timestamp: Date.now().toString()
        },
        ...chatMessages
    ];

    useEffect(() => {
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
    }, []);

    return { data, isLoading, error };
};
