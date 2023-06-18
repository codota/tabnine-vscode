import { useEffect } from "react";
import { vscode } from "../../utils/vscodeApi";

interface Request<T> {
  command: string;
  data?: T;
}

interface ExtensionMessage<T> {
  id: string;
  payload: T;
}

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

const pendingRequests = new Map<string, PendingRequest<any>>();

let messageCounter = 1;
function generateUniqueId(): string {
  messageCounter++;
  return messageCounter + "";
}

export function sendRequestToExtension<RequestPayloadType, ResponsePayloadType>(
  request: Request<RequestPayloadType>
): Promise<ResponsePayloadType> {
  const id = generateUniqueId();

  vscode.postMessage({ id, ...request });

  // return a promise that will be resolved once the response is received
  return new Promise((resolve, reject) => {
    // store the resolve function to call once the response is received
    pendingRequests.set(id, { resolve, reject });
  });
}

export function ExtensionCommunicationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // listen for messages from the extension
    window.addEventListener("message", handleResponse);

    return () => {
      window.removeEventListener("message", handleResponse);
    };
  }, []);

  return <>{children}</>;
}

function handleResponse(event: MessageEvent) {
  const message: ExtensionMessage<any> = event.data;

  // if this is a response to a request, resolve the corresponding promise
  if (pendingRequests.has(message.id)) {
    const pendingRequest = pendingRequests.get(message.id);
    pendingRequest?.resolve(message.payload);
    pendingRequests.delete(message.id);
  }
}
