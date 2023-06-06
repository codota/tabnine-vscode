type BaseSegment = {
  text: string;
};

type TextSegment = BaseSegment & {
  kind: "text";
};

type CodeSegment = BaseSegment & {
  kind: "code";
  language: string;
};

type HighlightSegment = BaseSegment & {
  kind: "highlight";
};

type BoldSegment = BaseSegment & {
  kind: "bold";
};

type TextListItemSegment = BaseSegment & {
  kind: "textListItem";
};

type ListSegment = BaseSegment & {
  kind: "listStart" | "listEnd";
};

export type MessageSegment =
  | TextSegment
  | CodeSegment
  | HighlightSegment
  | BoldSegment
  | TextListItemSegment
  | ListSegment;

const GLOBAL_REGEX = /```(.*?)(\n[\s\S]*?(```|$))/g;
const HIGHLIGHT_REGEX = /'([^\s]*?)'/g;
const BOLD_REGEX = /\*\*(.*?)\*\*/g;

export function getMessageSegments(text: string): MessageSegment[] {
  let match;
  let result: MessageSegment[] = [];
  let lastIndex = 0;

  while ((match = GLOBAL_REGEX.exec(text)) !== null) {
    const precedingText = text.substring(lastIndex, match.index);
    result = result.concat(getBoldAndHighlightedSegments(precedingText));

    const codeText = match[2].trim().replace("```", "");
    result.push({
      text: codeText.trim(),
      kind: "code",
      language: match[1].trim(),
    });

    lastIndex = GLOBAL_REGEX.lastIndex;
  }

  const trailingText = text.substring(lastIndex);
  result = result.concat(getBoldAndHighlightedSegments(trailingText));

  result = addListStartAndEnd(result);

  return result;
}

function getBoldAndHighlightedSegments(text: string): MessageSegment[] {
  let highlightMatch;
  let result: MessageSegment[] = [];
  let lastIndex = 0;

  while ((highlightMatch = HIGHLIGHT_REGEX.exec(text)) !== null) {
    const precedingText = text.substring(lastIndex, highlightMatch.index);
    result = result.concat(getBoldSegments(precedingText));

    const highlightText = highlightMatch[1].trim();
    result.push({
      text: highlightText,
      kind: "highlight",
    });

    lastIndex = HIGHLIGHT_REGEX.lastIndex;
  }

  const remainingText = text.substring(lastIndex);
  result = result.concat(getBoldSegments(remainingText));

  return result;
}

function getBoldSegments(text: string): MessageSegment[] {
  let match;
  let result: MessageSegment[] = [];
  let lastIndex = 0;

  while ((match = BOLD_REGEX.exec(text)) !== null) {
    const precedingText = text.substring(lastIndex, match.index).trim();
    if (precedingText) {
      result = result.concat(getTextOrListItemSegments(precedingText));
    }

    const boldText = match[1].trim();
    result.push({
      text: boldText,
      kind: "bold",
    });

    lastIndex = BOLD_REGEX.lastIndex;
  }

  const trailingText = text.substring(lastIndex).trim();
  if (trailingText) {
    result = result.concat(getTextOrListItemSegments(trailingText));
  }

  return result;
}

function getTextOrListItemSegments(text: string): MessageSegment[] {
  let result: MessageSegment[] = [];

  let lines = text.split("\n");
  for (let line of lines) {
    line = line.trim();

    if (line.startsWith("-")) {
      result.push({
        text: line.substring(1).trim(),
        kind: "textListItem",
      });
    } else if (line) {
      result.push({
        text: line,
        kind: "text",
      });
    }
  }

  return result;
}

function addListStartAndEnd(segments: MessageSegment[]): MessageSegment[] {
  let isList = false;
  const result: MessageSegment[] = [];

  segments.forEach((segment, index) => {
    if (segment.kind === "textListItem") {
      if (!isList) {
        isList = true;
        result.push({
          text: "" + index,
          kind: "listStart",
        });
      }
    } else if (isList) {
      isList = false;
      result.push({
        text: "" + index,
        kind: "listEnd",
      });
    }
    result.push(segment);
  });

  if (isList) {
    result.push({
      text: "",
      kind: "listEnd",
    });
  }

  return result;
}
