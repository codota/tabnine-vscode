export function isSandboxed(): boolean {
  // need to figure out how to inject this during the packaging phase.
  // see feature flags here: // https://webpack.js.org/plugins/define-plugin/#feature-flags
  // vsce isn't passing the argument to the vscode:prepublish phase (see package.json)
  // see this question: https://github.com/microsoft/vscode-vsce/issues/818
  // consider this post: https://moriz.xyz/blog/feature-flags-in-nextjs
  if (SANDBOX) {
    return SANDBOX;
  }
  return false;
}