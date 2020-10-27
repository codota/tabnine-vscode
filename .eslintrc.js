module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "airbnb-typescript",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    impliedStrict: true,
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-use-before-define": [
      "error",
      { functions: false, classes: false },
    ],
    "no-use-before-define": ["error", { functions: false, classes: false }],
    "import/no-unresolved": "error",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        ts: "never",
      },
    ],
  },
  settings: {
    node: {
      tryExtensions: [".js", ".json", ".node", ".ts", ".d.ts"],
    },
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
        project: "tsconfig.json",
      },
    },
  },
};
