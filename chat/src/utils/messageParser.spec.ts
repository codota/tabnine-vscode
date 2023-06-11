import { getMessageSegments } from "./messageParser";

describe("Test getMessageSegments", () => {
  test("", () => {
    const result = getMessageSegments(`

Hey, **This is a test** that \`checks\` the segments - \`of a text\`.
- \`bullet\` 1
- **bullet** 2

${"```"}javascript
const a = 1;
const b = 2;
const c = \`Hello, Hello\`;
${"```"}

${"```"}
int a = 1;
int b = 2;
int c = \`Hello, Hello\`;
${"```"}



1. bullet **number** 1
2. bullet \`number\` 2


`);
    expect(result).toStrictEqual([
      {
        type: "text",
        content: "\n\nHey, ",
      },
      {
        type: "bold",
        content: "This is a test",
      },
      {
        type: "text",
        content: " that ",
      },
      {
        type: "highlight",
        content: "checks",
      },
      {
        type: "text",
        content: " the segments - ",
      },
      {
        type: "highlight",
        content: "of a text",
      },
      {
        type: "text",
        content: ".\n",
      },
      {
        type: "bullet",
        content: "`bullet` 1",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bullet",
        content: "**bullet** 2",
      },
      {
        type: "text",
        content: "\n\n",
      },
      {
        type: "code",
        content: "const a = 1;\nconst b = 2;\nconst c = `Hello, Hello`;",
        language: "javascript",
      },
      {
        type: "text",
        content: "\n\n",
      },
      {
        type: "code",
        content: "int a = 1;\nint b = 2;\nint c = `Hello, Hello`;",
        language: "",
      },
      {
        type: "text",
        content: "\n\n\n\n",
      },
      {
        type: "bulletNumber",
        content: "bullet **number** 1",
        number: "1",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bulletNumber",
        content: "bullet `number` 2",
        number: "2",
      },
      {
        type: "text",
        content: "\n\n\n",
      },
    ]);
  });
});
