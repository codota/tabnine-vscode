module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "airbnb-typescript/base",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/errors",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "import", "no-only-tests"],
  ignorePatterns: ["vscode.proposed.inlineCompletions.d.ts"],
  rules: {
    "import/prefer-default-export": "off",
    "no-only-tests/no-only-tests": "error",
    "no-void": "off",
    "no-console": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["src/test/**/*.ts"],
      },
    ],
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowAny: true,
        allowNumber: true,
        allowBoolean: true,
        allowNullish: false,
      },
    ],
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
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};
