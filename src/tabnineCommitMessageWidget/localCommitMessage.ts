import * as path from "path";
import {
  CommitMessageConvention,
  CommitMessageOptions,
  VscodeDisplayLocale,
} from "./commitMessageSettings";

const MAX_SUBJECT_LENGTH = 72;

const GITMOJI_BY_TYPE: Record<string, string> = {
  feat: "✨",
  fix: "🐛",
  docs: "📝",
  test: "✅",
  refactor: "♻️",
  build: "📦️",
  chore: "🔧",
  perf: "⚡",
  style: "💄",
};

type LocalizedCopy = {
  verbs: Record<string, string>;
  defaults: Record<string, string>;
  filesSummary: (count: number, added: number, removed: number) => string;
};

const EN_COPY: LocalizedCopy = {
  verbs: {
    feat: "add",
    fix: "fix",
    docs: "update",
    test: "add tests for",
    refactor: "refactor",
    build: "update",
    chore: "update",
  },
  defaults: {
    feat: "update project files",
    fix: "resolve reported issue",
    docs: "update documentation",
    test: "improve test coverage",
    refactor: "simplify implementation",
    build: "update build configuration",
    chore: "update project files",
  },
  filesSummary: (count, added, removed) =>
    `${count} files (${added} insertions, ${removed} deletions)`,
};

const COPY: Partial<Record<VscodeDisplayLocale, LocalizedCopy>> = {
  en: EN_COPY,
  "pt-br": {
    verbs: {
      feat: "adicionar",
      fix: "corrigir",
      docs: "atualizar",
      test: "adicionar testes para",
      refactor: "refatorar",
      build: "atualizar",
      chore: "atualizar",
    },
    defaults: {
      feat: "atualizar arquivos do projeto",
      fix: "corrigir problema reportado",
      docs: "atualizar documentação",
      test: "melhorar cobertura de testes",
      refactor: "simplificar implementação",
      build: "atualizar configuração de build",
      chore: "atualizar arquivos do projeto",
    },
    filesSummary: (count, added, removed) =>
      `${count} arquivos (${added} inserções, ${removed} remoções)`,
  },
  es: {
    verbs: {
      feat: "agregar",
      fix: "corregir",
      docs: "actualizar",
      test: "agregar pruebas para",
      refactor: "refactorizar",
      build: "actualizar",
      chore: "actualizar",
    },
    defaults: {
      feat: "actualizar archivos del proyecto",
      fix: "resolver problema reportado",
      docs: "actualizar documentación",
      test: "mejorar cobertura de pruebas",
      refactor: "simplificar implementación",
      build: "actualizar configuración de build",
      chore: "actualizar archivos del proyecto",
    },
    filesSummary: (count, added, removed) =>
      `${count} archivos (${added} inserciones, ${removed} eliminaciones)`,
  },
};

function getLocalizedCopy(language: VscodeDisplayLocale): LocalizedCopy {
  if (language === "zh-tw") {
    return COPY["zh-cn"] ?? EN_COPY;
  }
  return COPY[language] ?? EN_COPY;
}

/** Offline heuristic formatter — used by tests and as emergency fallback only. */
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
  const files = extractChangedFiles(diff);
  const type = inferCommitType(diff, files);
  const scope = inferScope(files);
  const subject = inferSubject(type, files, diff, options.language);
  const baseMessage = formatMessage(type, scope, subject, options.convention);
  return applyCustomInstructions(baseMessage, options.customInstructions);
}

function formatMessage(
  type: string,
  scope: string | undefined,
  subject: string,
  convention: CommitMessageConvention
): string {
  switch (convention) {
    case "simple":
      return subject;
    case "gitmoji": {
      const emoji = GITMOJI_BY_TYPE[type] ?? "✨";
      return `${emoji} ${subject}`;
    }
    case "conventional":
    default: {
      const scopePart = scope ? `(${scope})` : "";
      return `${type}${scopePart}: ${subject}`;
    }
  }
}

function applyCustomInstructions(
  message: string,
  customInstructions: string
): string {
  const instructions = customInstructions.trim();
  if (!instructions) {
    return message;
  }
  if (instructions.includes("{message}")) {
    return instructions.split("{message}").join(message).trim();
  }
  return `${message}\n\n${instructions}`;
}

function extractChangedFiles(diff: string): string[] {
  const files = new Set<string>();
  const fileHeader = /^diff --git a\/(.+?) b\/(.+)$/gm;
  let match = fileHeader.exec(diff);
  while (match) {
    files.add(match[2] || match[1]);
    match = fileHeader.exec(diff);
  }
  return [...files];
}

function inferCommitType(diff: string, files: string[]): string {
  const lowerDiff = diff.toLowerCase();
  const lowerFiles = files.map((file) => file.toLowerCase());

  if (
    lowerFiles.some(
      (file) =>
        file.includes("test") ||
        file.includes("spec") ||
        file.endsWith(".test.ts") ||
        file.endsWith(".spec.ts")
    )
  ) {
    return "test";
  }

  if (
    lowerFiles.some(
      (file) =>
        file.endsWith(".md") ||
        file.includes("docs/") ||
        file.includes("readme")
    )
  ) {
    return "docs";
  }

  if (
    lowerFiles.some(
      (file) =>
        file.includes(".github/workflows") ||
        file.includes("dockerfile") ||
        file.endsWith("package.json") ||
        file.includes("webpack") ||
        file.includes("tsconfig")
    )
  ) {
    return "build";
  }

  if (
    /\bfix(es|ed|ing)?\b/.test(lowerDiff) ||
    /\bbug\b/.test(lowerDiff) ||
    lowerDiff.includes("null check") ||
    lowerDiff.includes("error handling")
  ) {
    return "fix";
  }

  if (
    /\brefactor/.test(lowerDiff) ||
    lowerDiff.includes("rename") ||
    lowerDiff.includes("move ")
  ) {
    return "refactor";
  }

  return "feat";
}

function inferScope(files: string[]): string | undefined {
  if (!files.length) {
    return undefined;
  }

  const segments = files
    .map((file) => file.replace(/\\/g, "/").split("/"))
    .filter((parts) => parts.length > 1);

  if (!segments.length) {
    const base = path.basename(files[0], path.extname(files[0]));
    return sanitizeScope(base);
  }

  const firstSegments = segments.map((parts) =>
    parts[0] === "src" && parts[1] ? parts[1] : parts[0]
  );
  const unique = [...new Set(firstSegments)];
  if (unique.length === 1) {
    return sanitizeScope(unique[0]);
  }

  return undefined;
}

function inferSubject(
  type: string,
  files: string[],
  diff: string,
  language: VscodeDisplayLocale
): string {
  const copy = getLocalizedCopy(language);

  if (!files.length) {
    return copy.defaults[type] ?? copy.defaults.feat;
  }

  const verb = copy.verbs[type] ?? copy.verbs.feat;

  if (files.length === 1) {
    const fileName = path.basename(files[0], path.extname(files[0]));
    return truncateSubject(`${verb} ${toReadableName(fileName)}`);
  }

  const topLevel = summarizePaths(files);
  if (topLevel) {
    return truncateSubject(`${verb} ${topLevel}`);
  }

  const added = countLines(diff, "+");
  const removed = countLines(diff, "-");
  return truncateSubject(
    `${verb} ${copy.filesSummary(files.length, added, removed)}`
  );
}

function summarizePaths(files: string[]): string | undefined {
  const normalized = files.map((file) => file.replace(/\\/g, "/"));
  const dirs = [
    ...new Set(
      normalized.map((file) => {
        const parts = file.split("/");
        if (parts[0] === "src" && parts[1]) {
          return parts[1];
        }
        return parts.length > 1
          ? parts[0]
          : path.basename(file, path.extname(file));
      })
    ),
  ];

  if (dirs.length === 1) {
    return toReadableName(dirs[0]);
  }

  if (dirs.length <= 3) {
    return dirs.map(toReadableName).join(", ");
  }

  return undefined;
}

function toReadableName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sanitizeScope(scope: string): string {
  return scope
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 32);
}

function countLines(diff: string, prefix: "+" | "-"): number {
  return diff
    .split("\n")
    .filter(
      (line) => line.startsWith(prefix) && !line.startsWith(prefix + prefix)
    ).length;
}

function truncateSubject(subject: string): string {
  if (subject.length <= MAX_SUBJECT_LENGTH) {
    return subject;
  }
  return `${subject.slice(0, MAX_SUBJECT_LENGTH - 3).trimEnd()}...`;
}
