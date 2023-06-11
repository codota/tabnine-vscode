import { getMessageSegments } from "./messageParser";

describe("Test getMessageSegments", () => {
  test("Text only", () => {
    const result = getMessageSegments(`This is a test message.`);
    expect(result).toStrictEqual([
      {
        type: "text",
        content: "This is a test message.",
      },
    ]);
  });

  test("Bold at different positions", () => {
    const result = getMessageSegments(
      `**This** is a test **message** for **bold**.`
    );
    expect(result).toStrictEqual([
      {
        type: "bold",
        content: "This",
      },
      {
        type: "text",
        content: " is a test ",
      },
      {
        type: "bold",
        content: "message",
      },
      {
        type: "text",
        content: " for ",
      },
      {
        type: "bold",
        content: "bold",
      },
      {
        type: "text",
        content: ".",
      },
    ]);
  });

  test("Highlight at different positions", () => {
    const result = getMessageSegments(
      `\`This\` is a test \`message\` for \`highlight\`.`
    );
    expect(result).toStrictEqual([
      {
        type: "highlight",
        content: "This",
      },
      {
        type: "text",
        content: " is a test ",
      },
      {
        type: "highlight",
        content: "message",
      },
      {
        type: "text",
        content: " for ",
      },
      {
        type: "highlight",
        content: "highlight",
      },
      {
        type: "text",
        content: ".",
      },
    ]);
  });

  test("Bullets at different positions", () => {
    const result = getMessageSegments(`- This\n- is\n- a\n- test\n- message.`);
    expect(result).toStrictEqual([
      {
        type: "bullet",
        content: "This",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bullet",
        content: "is",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bullet",
        content: "a",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bullet",
        content: "test",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bullet",
        content: "message.",
      },
    ]);
  });

  test("Numbered bullets at different positions", () => {
    const result = getMessageSegments(
      `1. This\n2. is\n3. a\n4. test\n5. message.`
    );
    expect(result).toStrictEqual([
      {
        type: "bulletNumber",
        content: "This",
        number: "1",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bulletNumber",
        content: "is",
        number: "2",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bulletNumber",
        content: "a",
        number: "3",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bulletNumber",
        content: "test",
        number: "4",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bulletNumber",
        content: "message.",
        number: "5",
      },
    ]);
  });

  test("Code at different positions", () => {
    const result = getMessageSegments(
      `${"```"}javascript\nconst a = 1;\n${"```"} This is a test message ${"```"}\nint b = 2;\n${"```"}`
    );
    expect(result).toStrictEqual([
      {
        type: "code",
        content: "const a = 1;",
        language: "javascript",
      },
      {
        type: "text",
        content: " This is a test message ",
      },
      {
        type: "code",
        content: "int b = 2;",
        language: "",
      },
    ]);
  });

  test("Link at different positions", () => {
    const result = getMessageSegments(
      `This is a [test](https://example.com) message.`
    );
    expect(result).toStrictEqual([
      {
        type: "text",
        content: "This is a ",
      },
      {
        type: "link",
        content: "test",
        url: "https://example.com",
      },
      {
        type: "text",
        content: " message.",
      },
    ]);
  });

  test("Mix of all types", () => {
    const result = getMessageSegments(`
This is a **test** message for \`all\` types:
- bullet
1. numbered bullet
${"```"}javascript\nconsole.log("Hello, world!");\n${"```"}
[link](https://example.com)
    `);
    expect(result).toStrictEqual([
      {
        type: "text",
        content: "\nThis is a ",
      },
      {
        type: "bold",
        content: "test",
      },
      {
        type: "text",
        content: " message for ",
      },
      {
        type: "highlight",
        content: "all",
      },
      {
        type: "text",
        content: " types:\n",
      },
      {
        type: "bullet",
        content: "bullet",
      },
      {
        type: "text",
        content: "",
      },
      {
        type: "bulletNumber",
        content: "numbered bullet",
        number: "1",
      },
      {
        type: "text",
        content: "\n",
      },
      {
        type: "code",
        content: 'console.log("Hello, world!");',
        language: "javascript",
      },
      {
        type: "text",
        content: "\n",
      },
      {
        type: "link",
        content: "link",
        url: "https://example.com",
      },
      {
        type: "text",
        content: "\n    ",
      },
    ]);
  });

  test("Mix of all types", () => {
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
