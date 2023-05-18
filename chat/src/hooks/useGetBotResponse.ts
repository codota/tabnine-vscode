import { useEffect, useRef, useState } from 'react';

const URL = 'http://localhost:3010/chat/generate_chat_response';

type BotResponse = {
    data: string;
    isLoading: boolean;
    error: Error | null;
}

export function useFetchStream(input: string): BotResponse {
    const [data, setData] = useState("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const isProcessing = useRef(false);

    useEffect(() => {
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
                            input
                        })
                    });

                    if (!response.body) {
                        throw Error('ReadableStream not yet supported in this browser.');
                    }

                    const reader = response.body.getReader();

                    const stream = new ReadableStream({
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
                    setError(err as Error);
                }
            };

            fetchData();
        }
    }, []);

    return { data, isLoading, error };
};
