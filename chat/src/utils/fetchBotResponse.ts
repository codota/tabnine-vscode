import { encode, decode } from "@msgpack/msgpack";
import { EditorContext } from "../hooks/useEditorContext";

type Input = {
  id?: string;
  text: string;
  by: "user" | "chat";
  editorContext?: EditorContext;
}[];
type FetchResponseRequestBody = {
  token: string;
  input: Input;
  conversationId: string;
  messageId: string;
};

type OnData = (text: string) => void;
type OnDone = () => void;
type OnError = (text: string) => void;

type StreamResponseObject = {
  text: string;
  isError?: boolean;
};

const URL = "https://api.tabnine.com/chat/generate_chat_response";
const TIMEOUT = 10000;

export function fetchChatResponse(
  { token, input, conversationId, messageId }: FetchResponseRequestBody,
  onData: OnData,
  onDone: OnDone,
  onError: OnError
): () => void {
  const abortController = new AbortController();
  const fetchData = async () => {
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, TIMEOUT);

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-msgpack",
          Authorization: `Bearer ${token}`,
        },
        body: encode({
          input,
          conversationId,
          messageId,
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
            const decodedValue = decoder.decode(value, { stream: true });
            const values = decodedValue.split("\n").filter((obj) => !!obj);
            values.forEach((valueString) => {
              let { text, isError } = decode(
                valueString.split(",").map(Number)
              ) as StreamResponseObject;
              if (isError) {
                onError(`\n${text}`);
              } else {
                onData(text);
              }
            });
          } catch (e) {
            onError("Failed to parse the server response");
          }
        }
        // keep reading
        return await reader.read().then(process);
      };

      reader
        .read()
        .then(process)
        .catch(() => onError("Network error"));
    } catch (err) {
      onError("Unable to generate a response");
    } finally {
      clearTimeout(timeoutId); // clear timeout if fetch is successful
    }
  };

  fetchData();

  return () => abortController.abort();
}
