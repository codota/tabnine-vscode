export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "highlight"; content: string }
  | { type: "bullet"; content: string }
  | { type: "bulletNumber"; content: string; number: string }
  | { type: "code"; content: string; language: string };

const TYPES_REGEX = [
  { type: "bold", regexp: /\*\*(.+?)\*\*/gs },
  { type: "highlight", regexp: /'([^'\s]+)'/gs },
  { type: "bullet", regexp: /^- (.+?)$/gms },
  { type: "bulletNumber", regexp: /^(\d+)\. (.+?)$/gms },
  { type: "code", regexp: /```(\w+)?\n?/gs },
];

export function getMessageSegments(response: string): MessageSegment[] {
  const parts: MessageSegment[] = [];

  let currIndex = 0;
  while (currIndex < response.length) {
    let nextMatch: RegExpExecArray | null = null;
    let matchType: string | null = null;

    for (const { type, regexp } of TYPES_REGEX) {
      regexp.lastIndex = currIndex; // Set where to start searching
      const match = regexp.exec(response);
      if (match && (nextMatch === null || match.index < nextMatch.index)) {
        nextMatch = match;
        matchType = type;
      }
    }

    if (nextMatch && nextMatch.index > currIndex) {
      parts.push({
        type: "text",
        content: response
          .slice(currIndex, nextMatch.index)
          .replace(/\n+/g, "\n"),
      });
      currIndex = nextMatch.index;
    }

    if (nextMatch) {
      if (matchType === "code") {
        const codeStartIndex = nextMatch.index + nextMatch[0].length;
        const codeEndIndex = response.indexOf("```", codeStartIndex);
        const content =
          codeEndIndex !== -1
            ? response.slice(codeStartIndex, codeEndIndex)
            : response.slice(codeStartIndex);
        parts.push({
          type: matchType,
          content: content.trim(),
          language: nextMatch[1] || "",
        });
        currIndex = codeEndIndex !== -1 ? codeEndIndex + 3 : response.length;
      } else if (matchType === "bulletNumber") {
        parts.push({
          type: matchType,
          content: nextMatch[2],
          number: nextMatch[1],
        });
        currIndex = nextMatch.index + nextMatch[0].length;
      } else {
        parts.push({ type: matchType as any, content: nextMatch[1] });
        currIndex = nextMatch.index + nextMatch[0].length;
      }
    } else {
      parts.push({
        type: "text",
        content: response.slice(currIndex).replace(/\n+/g, "\n"),
      });
      break;
    }
  }

  return parts;
}
