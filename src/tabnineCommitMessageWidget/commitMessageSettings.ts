import * as vscode from "vscode";

export const COMMIT_MESSAGE_ENABLED_SETTING = "tabnine.commitMessageEnabled";
export const COMMIT_MESSAGE_CONVENTION_SETTING =
  "tabnine.commitMessageConvention";
export const COMMIT_MESSAGE_LANGUAGE_SETTING = "tabnine.commitMessageLanguage";
export const COMMIT_MESSAGE_CUSTOM_INSTRUCTIONS_SETTING =
  "tabnine.commitMessageCustomInstructions";

export const VSCODE_DISPLAY_LOCALES = [
  "en",
  "zh-cn",
  "zh-tw",
  "fr",
  "de",
  "it",
  "es",
  "ja",
  "ko",
  "ru",
  "pt-br",
  "tr",
  "pl",
  "cs",
  "hu",
] as const;

export type CommitMessageConvention = "conventional" | "simple" | "gitmoji";
export type VscodeDisplayLocale = typeof VSCODE_DISPLAY_LOCALES[number];
export type CommitMessageLanguageSetting = "auto" | VscodeDisplayLocale;

export interface CommitMessageOptions {
  enabled: boolean;
  convention: CommitMessageConvention;
  language: VscodeDisplayLocale;
  languageSetting: CommitMessageLanguageSetting;
  customInstructions: string;
}

export function isCommitMessageSettingEnabled(): boolean {
  return getCommitMessageOptions().enabled;
}

export function getCommitMessageOptions(): CommitMessageOptions {
  const config = vscode.workspace.getConfiguration("tabnine");
  const languageSetting = normalizeLanguageSetting(
    config.get<string>("commitMessageLanguage", "auto")
  );

  return {
    enabled: config.get<boolean>("commitMessageEnabled", true),
    convention: normalizeConvention(
      config.get<string>("commitMessageConvention", "conventional")
    ),
    languageSetting,
    language: resolveCommitMessageLanguage(languageSetting),
    customInstructions: (
      config.get<string>("commitMessageCustomInstructions", "") ?? ""
    ).trim(),
  };
}

export function resolveCommitMessageLanguage(
  setting: CommitMessageLanguageSetting,
  vscodeLanguage: string = vscode.env.language
): VscodeDisplayLocale {
  const raw = setting === "auto" ? vscodeLanguage : setting;
  return matchVscodeLocale(raw);
}

function matchVscodeLocale(value: string): VscodeDisplayLocale {
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");

  const exact = VSCODE_DISPLAY_LOCALES.find((locale) => locale === normalized);
  if (exact) {
    return exact;
  }

  if (normalized === "pt-br" || normalized.startsWith("pt-br")) {
    return "pt-br";
  }
  if (normalized.startsWith("zh-hans") || normalized === "zh-cn") {
    return "zh-cn";
  }
  if (normalized.startsWith("zh-hant") || normalized === "zh-tw") {
    return "zh-tw";
  }
  if (normalized.startsWith("zh")) {
    return "zh-cn";
  }

  const base = normalized.split("-")[0];
  if (base === "pt") {
    return "pt-br";
  }

  const byBase = VSCODE_DISPLAY_LOCALES.find(
    (locale) => locale === base || locale.startsWith(`${base}-`)
  );
  if (byBase) {
    return byBase;
  }

  return "en";
}

function normalizeConvention(value: string): CommitMessageConvention {
  if (value === "simple" || value === "gitmoji") {
    return value;
  }
  return "conventional";
}

function normalizeLanguageSetting(value: string): CommitMessageLanguageSetting {
  if (value === "auto") {
    return "auto";
  }

  const matched = matchVscodeLocale(value);
  if (VSCODE_DISPLAY_LOCALES.includes(matched)) {
    return matched;
  }

  return "auto";
}
