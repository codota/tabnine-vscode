import { useEffect, useState } from 'react';

const URL = 'http://35.223.132.152:8080/generate_stream';
const MAX_TOKENS = 200;

interface Token {
    id: number;
    text: string;
    logprob: number;
    special: boolean;
}

interface StreamResponse {
    token: Token;
    generated_text: string | null;
    details: string | null;
}

type BotResponse = {
    data: string;
    isLoading: boolean;
    error: Error | null;
}

function isJson(json: string) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        console.error(`not a complete json: ${json}`);
        return false;
    }
}

export function useFetchStream(input: string): BotResponse {
    const [data, setData] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: input,
                        parameters: {
                            max_new_tokens: MAX_TOKENS
                        }
                    })
                });

                if (!response.body) {
                    throw Error('ReadableStream not yet supported in this browser.');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');

                const stream = new ReadableStream({
                    start(controller) {
                        function push() {
                            reader.read().then(({ done, value }) => {
                                if (done) {
                                    setIsLoading(false);
                                    controller.close();
                                    return;
                                }
                                let accumulator = '';

                                // Parse each chunk and update state immediately
                                if (value) {
                                    const chunk = decoder.decode(value, { stream: true });
                                    accumulator += chunk;
                                    const lines = accumulator.split('\n');

                                    lines.forEach((line, index) => {
                                        if (line === '' && lines[index - 1]) {
                                            // Encountered an empty line, meaning end of current event data
                                            const jsonStr = lines[index - 1].slice('data:'.length);
                                            try {
                                                // Check if the JSON string is complete
                                                if (isJson(jsonStr)) {
                                                    const parsedData: StreamResponse = JSON.parse(jsonStr);
                                                    setData(oldData => oldData + parsedData.token.text);
                                                } else {
                                                    // The JSON string is not complete, leave it in the accumulator
                                                    accumulator = 'data:' + jsonStr + '\n';
                                                }
                                            } catch (e) {
                                                console.error("Invalid JSON:", e);
                                            }
                                        }
                                    });

                                    // If the last line is complete (ends in a newline), reset the accumulator
                                    if (accumulator.endsWith('\n')) {
                                        accumulator = '';
                                    } else {
                                        // Otherwise, keep the last line in the accumulator for the next chunk
                                        accumulator = lines[lines.length - 1];
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
    }, []);

    return { data, isLoading, error };
};
