import axios from "axios";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";

const instance = axios.create({
  baseURL: tabnineExtensionProperties.chatApiBaseUrl,
  timeout: 60000,
});

export interface ChatModel {
  id: string;
  name?: string;
  isEnabled?: boolean;
}

export interface ModelsResponse {
  models?: ChatModel[];
  default?: string;
}

export interface GenerateChatRequest {
  modelParams: {
    temperature: number;
    top_p: number;
  };
  modelId: string;
  conversationId: string;
  messageId: string;
  input: unknown[];
  isTelemetryEnabled: boolean;
}

export interface AsyncGenerateResponse {
  streamId?: string;
}

function authHeaders(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function getModels(token: string): Promise<ModelsResponse> {
  return (
    await instance.get<ModelsResponse>("chat/v2/models", {
      headers: authHeaders(token),
    })
  ).data;
}

export async function generateChatResponseAsync(
  token: string,
  payload: GenerateChatRequest
): Promise<AsyncGenerateResponse> {
  return (
    await instance.post<AsyncGenerateResponse>(
      "chat/v1/generate_chat_response_async",
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    )
  ).data;
}

export async function waitForStream(
  token: string,
  streamId: string
): Promise<string> {
  const { data } = await instance.get<string>(
    `chat/v1/stream/${streamId}/wait`,
    {
      headers: authHeaders(token),
      responseType: "text",
      transformResponse: [(body) => body],
    }
  );

  return typeof data === "string" ? data : String(data ?? "");
}
