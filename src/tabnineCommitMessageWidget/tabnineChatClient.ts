import { randomBytes } from "crypto";
import axios, { AxiosInstance } from "axios";
import {
  ChatCommunicationKind,
  getChatCommunicatorAddress,
  getState,
} from "../binary/requests/requests";
import { Logger } from "../utils/logger";
import {
  CommitMessageOptions,
  VscodeDisplayLocale,
} from "./commitMessageSettings";

const DEFAULT_CHAT_API_BASE = "https://api.tabnine.com";
const REQUEST_TIMEOUT_MS = 60_000;

function createUuid(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type ChatModel = {
  id: string;
  name?: string;
  isEnabled?: boolean;
};

type ModelsResponse = {
  models?: ChatModel[];
  default?: string;
};

type AsyncGenerateResponse = {
  streamId?: string;
};

type StreamChunk = {
  value?: {
    text?: string;
  };
};

const LANGUAGE_LABELS: Record<VscodeDisplayLocale, string> = {
  en: "English",
  "zh-cn": "Simplified Chinese",
  "zh-tw": "Traditional Chinese",
  fr: "French",
  de: "German",
  it: "Italian",
  es: "Spanish",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  "pt-br": "Brazilian Portuguese",
  tr: "Turkish",
  pl: "Polish",
  cs: "Czech",
  hu: "Hungarian",
};

export class TabnineAuthError extends Error {
  constructor(message = "Sign in to Tabnine to generate commit messages.") {
    super(message);
    this.name = "TabnineAuthError";
  }
}

export async function generateCommitMessageWithTabnine(
  diff: string,
  options: CommitMessageOptions
): Promise<string> {
  const state = await getState();
  const token = state?.access_token;
  if (!token) {
    throw new TabnineAuthError();
  }

  const client = await createChatClient(token);
  const modelId = await resolveModelId(client);
  const prompt = buildCommitPrompt(diff, options);
  const streamId = await startGeneration(client, modelId, prompt);
  const message = await waitForGeneration(client, streamId);
  const cleaned = sanitizeCommitMessage(message);

  if (!cleaned) {
    throw new Error("Tabnine returned an empty commit message.");
  }

  return cleaned;
}

async function createChatClient(token: string): Promise<AxiosInstance> {
  const baseURL = await resolveChatApiBase();
  return axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function resolveChatApiBase(): Promise<string> {
  try {
    const address = await getChatCommunicatorAddress(
      ChatCommunicationKind.Root
    );
    if (address) {
      return address.replace(/\/$/, "");
    }
  } catch (error) {
    Logger.warn(
      `Failed to resolve Tabnine chat communicator, falling back to ${DEFAULT_CHAT_API_BASE}`,
      error
    );
  }

  return DEFAULT_CHAT_API_BASE;
}

async function resolveModelId(client: AxiosInstance): Promise<string> {
  const { data } = await client.get<ModelsResponse>("/chat/v2/models");
  if (data.default) {
    return data.default;
  }

  const enabled = data.models?.find((model) => model.isEnabled !== false);
  if (enabled?.id) {
    return enabled.id;
  }

  if (data.models?.[0]?.id) {
    return data.models[0].id;
  }

  throw new Error("No Tabnine chat model is available for your account.");
}

async function startGeneration(
  client: AxiosInstance,
  modelId: string,
  prompt: string
): Promise<string> {
  const conversationId = createUuid();
  const messageId = createUuid();
  const botMessageId = createUuid();

  const payload = {
    modelParams: {
      temperature: 0.2,
      top_p: 0.2,
    },
    modelId,
    conversationId,
    messageId,
    input: [
      {
        id: createUuid(),
        conversationId,
        text: prompt,
        isBot: false,
        botMessageId,
        textNodes: [{ type: "text", text: prompt }],
        version: "v1",
        intent: "",
        timestamp: Date.now().toString(),
        messageContext: [],
        generateOnlyAdditionalPart: false,
        hasOpenFile: false,
        hasSelectedCode: false,
        by: "user",
      },
    ],
    isTelemetryEnabled: false,
  };

  const { data } = await client.post<AsyncGenerateResponse>(
    "/chat/v1/generate_chat_response_async",
    payload
  );

  if (!data.streamId) {
    throw new Error("Tabnine did not return a stream id for generation.");
  }

  return data.streamId;
}

async function waitForGeneration(
  client: AxiosInstance,
  streamId: string
): Promise<string> {
  const { data } = await client.get<string>(`/chat/v1/stream/${streamId}/wait`, {
    responseType: "text",
    transformResponse: [(body) => body],
  });

  return parseStreamText(typeof data === "string" ? data : String(data ?? ""));
}

function parseStreamText(raw: string): string {
  const chunks: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("{")) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as StreamChunk;
      const text = parsed.value?.text;
      if (text) {
        chunks.push(text);
      }
    } catch {
      // Ignore non-JSON keep-alive lines.
    }
  }

  return chunks.join("");
}

function buildCommitPrompt(diff: string, options: CommitMessageOptions): string {
  const language = LANGUAGE_LABELS[options.language] ?? "English";
  const conventionRules = getConventionRules(options.convention);
  const custom = options.customInstructions
    ? `\nAdditional instructions from the user:\n${options.customInstructions}\n`
    : "";

  return [
    "You are Tabnine. Generate a git commit message for the following diff.",
    `Write the commit message in ${language}.`,
    conventionRules,
    custom,
    "Reply with ONLY the commit message. No markdown fences, no quotes, no explanation.",
    "Diff:",
    "```diff",
    diff,
    "```",
  ]
    .filter((part) => part.trim().length > 0)
    .join("\n\n");
}

function getConventionRules(
  convention: CommitMessageOptions["convention"]
): string {
  switch (convention) {
    case "simple":
      return "Convention: write a plain concise subject line without type prefixes.";
    case "gitmoji":
      return "Convention: start with a single relevant gitmoji, then a short subject.";
    case "conventional":
    default:
      return "Convention: Conventional Commits, e.g. feat(scope): subject. Optional short body after a blank line.";
  }
}

function sanitizeCommitMessage(message: string): string {
  return message
    .replace(/^```(?:\w+)?\n?/g, "")
    .replace(/\n?```$/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}
