import * as vscode from "vscode";
import {
  CommitMessageOptions,
  getCommitMessageOptions,
} from "./commitMessageSettings";
import { buildLocalCommitMessage as buildLocal } from "./localCommitMessage";
import {
  generateCommitMessageWithTabnine,
  TabnineAuthError,
} from "./tabnineChatClient";
import { Logger } from "../utils/logger";

const MAX_DIFF_CHARS = 12_000;

export async function generateCommitMessageFromDiff(
  diff: string,
  token: vscode.CancellationToken,
  options: CommitMessageOptions = getCommitMessageOptions()
): Promise<string> {
  if (token.isCancellationRequested) {
    return "";
  }

  const truncatedDiff = truncateDiff(diff);

  try {
    const message = await generateCommitMessageWithTabnine(
      truncatedDiff,
      options
    );
    if (token.isCancellationRequested) {
      return "";
    }
    return applyTemplateInstructions(message, options.customInstructions);
  } catch (error) {
    if (error instanceof TabnineAuthError) {
      throw error;
    }

    Logger.error("Tabnine AI commit message generation failed", error);
    throw error;
  }
}

/** Exported for unit tests of offline formatting helpers. */
export function buildLocalCommitMessage(
  diff: string,
  options: Pick<
    CommitMessageOptions,
    "convention" | "language" | "customInstructions"
  > = {
    convention: "conventional",
    language: "en",
    customInstructions: "",
  }
): string {
  return buildLocal(diff, options);
}

function applyTemplateInstructions(
  message: string,
  customInstructions: string
): string {
  const instructions = customInstructions.trim();
  if (!instructions || !instructions.includes("{message}")) {
    return message;
  }
  return instructions.split("{message}").join(message).trim();
}

function truncateDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) {
    return diff;
  }
  return `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated]`;
}
