export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "highlight"; content: string }
  | { type: "bullet"; content: string }
  | { type: "bulletNumber"; content: string; number: string }
  | { type: "code"; content: string; language: string }
  | { type: "link"; content: string; url: string };

const TYPES_REGEX = [
  { type: "bold", regexp: /\*\*(.+?)\*\*/gs },
  { type: "highlight", regexp: /`([^`]+)`/gs },
  { type: "bullet", regexp: /^- (.+?)$/gms },
  { type: "bulletNumber", regexp: /^(\d+)\. (.+?)$/gms },
  { type: "code", regexp: /```(\w+)?\n?/gs },
  /* eslint-disable no-useless-escape */
  { type: "link", regexp: /\[([^\]]+)\]\(([^\)]+)\)/gs },
  /* eslint-enable no-useless-escape */
];

export function getMessageSegments(response: string): MessageSegment[] {
  const parts: MessageSegment[] = [];

  let currIndex = 0;
  while (currIndex < response.length) {
    let nextMatch: RegExpExecArray | null = null;
    let matchType: string | null = null;

    // eslint-disable-next-line no-restricted-syntax
    for (const { type, regexp } of TYPES_REGEX) {
      regexp.lastIndex = currIndex; // Set where to start searching
      const match = regexp.exec(response);
      if (match && (nextMatch === null || match.index < nextMatch.index)) {
        nextMatch = match;
        matchType = type;
      }
    }

    if (nextMatch && nextMatch.index > currIndex) {
      const content = response.slice(currIndex, nextMatch.index);
      if (content) {
        parts.push({
          type: "text",
          content,
        });
      }
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
      } else if (matchType === "link") {
        parts.push({
          type: matchType,
          content: nextMatch[1],
          url: nextMatch[2],
        });
        currIndex = nextMatch.index + nextMatch[0].length;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        parts.push({ type: matchType as any, content: nextMatch[1] });
        currIndex = nextMatch.index + nextMatch[0].length;
      }
    } else {
      const content = response.slice(currIndex);
      if (content) {
        parts.push({
          type: "text",
          content,
        });
      }
      break;
    }
  }

  return parts.map((part, index) => {
    let res = part;
    if (index > 0 && index < parts.length - 1) {
      const partBeforeType = parts[index - 1].type;
      const partAfterType = parts[index + 1].type;
      const hasBulletBefore =
        partBeforeType === "bullet" || partBeforeType === "bulletNumber";
      const hasBulletAfter =
        partAfterType === "bullet" || partAfterType === "bulletNumber";
      if (part.type === "text" && hasBulletBefore && hasBulletAfter) {
        res = { ...part, content: part.content.trim() };
      }
    }
    return res;
  });
}
