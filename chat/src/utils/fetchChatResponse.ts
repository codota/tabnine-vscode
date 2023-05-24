type Input = {
  text: string;
  by: "user" | "chat";
}[];
type OnData = (text: string) => void;
type OnDone = () => void;
type OnError = (text: string) => void;

const URL = "http://localhost:3010/chat/generate_chat_response";
const TIMEOUT = 3000;

export function fetchChatResponse(
  input: Input,
  onData: OnData,
  onDone: OnDone,
  onError: OnError
) {
  const fetchData = async () => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, TIMEOUT);

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
        }),
        signal: abortController.signal,
      });

      if (!response.body) {
        throw Error("ReadableStream not yet supported in this browser.");
      }

      const decoder = new TextDecoder("utf-8");
      const reader = response.body.getReader();
      const process = async ({
        done,
        value,
      }: ReadableStreamReadResult<BufferSource>): Promise<
        ReadableStreamReadResult<BufferSource>
      > => {
        if (done) {
          onDone();
          reader.cancel();
          return { done: true };
        }
        if (value) {
          try {
            let chunk = decoder.decode(value, { stream: true });
            onData(chunk);
          } catch (e) {}
        }
        // keep reading
        return await reader.read().then(process);
      };

      reader
        .read()
        .then(process)
        .catch(() => {
          onError("Network error");
        });
    } catch (err) {
      console.error(err);
      onError("Unable to generate a response");
    } finally {
      clearTimeout(timeoutId); // clear timeout if fetch is successful
    }
  };

  fetchData();
}
