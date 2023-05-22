type Input = {
    text : string;
    by : "user" | "chat";
}[];
type OnData = (text: string) => void;
type OnDone = () => void;
type OnError = (text: string) => void;

const URL = 'http://localhost:3010/chat/generate_chat_response';

export function fetchChatResponse(input: Input, onData: OnData, onDone: OnDone, onError: OnError) {
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

            new ReadableStream({
                start(controller) {
                    function push() {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                onDone();
                                controller.close();
                                return;
                            }
                            if (value) {
                                try {
                                    let chunk = new TextDecoder("utf-8").decode(value, { stream: true });
                                    onData(chunk);
                                } catch (e) {
                                    console.error("Invalid JSON:", e);
                                }
                            }
                            push();
                        }).catch(e => onError(e.message));
                    };
                    push();
                }
            });

        } catch (err) {
            console.error(err);
            onError("Failed to generate response");
        }
    };

    fetchData();
}