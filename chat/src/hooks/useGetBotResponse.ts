import { useEffect, useRef, useState } from 'react';
import { ChatMessages } from '../types/ChatTypes';
import { useEditorContext } from './useEditorContext';
import { useJwt } from './useJwt';

const URL = 'http://localhost:3010/chat/generate_chat_response';

type BotResponse = {
    data: string;
    isLoading: boolean;
    error: string | null;
}

export function useFetchStream(chatMessages: ChatMessages): BotResponse {
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
            const fetchData = async () => {
                try {
                    const response = await fetch(URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            input: chatContext.map((message) => ({
                                text: message.text,
                                by: message.isBot ? "chat" : "user"
                            }))
                        })
                    });

                    if (!response.body) {
                        throw Error('ReadableStream not yet supported in this browser.');
                    }

                    const reader = response.body.getReader();

                    new ReadableStream({
                        start(controller) {
                            function push() {
                                reader.read().then(({ done, value }) => {
                                    if (done) {
                                        setIsLoading(false);
                                        controller.close();
                                        isProcessing.current = false;
                                        return;
                                    }
                                    // Parse each chunk and update state immediately
                                    if (value) {
                                        try {
                                            let chunk = new TextDecoder("utf-8").decode(value, { stream: true });
                                            setData(oldData => oldData + chunk);
                                        } catch (e) {
                                            console.error("Invalid JSON:", e);
                                        }
                                    }
                                    push();
                                }).catch(setError);
                            };
                            push();
                        }
                    });

                } catch (err) {
                    console.error(err);
                    setError("Failed to generate response");
                }
            };

            fetchData();
        }
    }, [isEditorContextReady]);

    return { data, isLoading, error };
};
