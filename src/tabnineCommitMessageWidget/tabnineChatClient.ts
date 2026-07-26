import * as crypto from "crypto";
import { getState } from "../binary/requests/requests";
import * as api from "./api";
import {
  CommitMessageOptions,
  VscodeDisplayLocale,
} from "./commitMessageSettings";

// @types/node@12 does not declare randomUUID; the extension host provides it.
const randomUUID = (
  crypto as typeof crypto & { randomUUID: () => string }
).randomUUID.bind(crypto);

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

type StreamChunk = {
  value?: {
    text?: string;
  };
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

  const models = await api.getModels(token);
  const modelId = resolveModelId(models);
  const prompt = buildCommitPrompt(diff, options);
  const payload = buildGeneratePayload(modelId, prompt);
  const { streamId } = await api.generateChatResponseAsync(token, payload);

  if (!streamId) {
    throw new Error("Tabnine did not return a stream id for generation.");
  }

  const raw = await api.waitForStream(token, streamId);
  const cleaned = sanitizeCommitMessage(parseStreamText(raw));

  if (!cleaned) {
    throw new Error("Tabnine returned an empty commit message.");
  }

  return cleaned;
}

function resolveModelId(models: api.ModelsResponse): string {
  if (models.default) {
    return models.default;
  }

  const enabled = models.models?.find((model) => model.isEnabled !== false);
  if (enabled?.id) {
    return enabled.id;
  }

  if (models.models?.[0]?.id) {
    return models.models[0].id;
  }

  throw new Error("No Tabnine chat model is available for your account.");
}

function buildGeneratePayload(
  modelId: string,
  prompt: string
): api.GenerateChatRequest {
  const conversationId = randomUUID();
  const messageId = randomUUID();
  const botMessageId = randomUUID();

  return {
    modelParams: {
      temperature: 0.2,
      top_p: 0.2,
    },
    modelId,
    conversationId,
    messageId,
    input: [
      {
        id: randomUUID(),
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

function sanitizeCommitMessage(message: string): string {
  return message
    .replace(/^```(?:\w+)?\n?/g, "")
    .replace(/\n?```$/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

/** Exported for unit tests. */
export const commitMessageText = {
  parseStreamText,
  sanitizeCommitMessage,
};
