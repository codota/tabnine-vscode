export function once(key: string, context) {
  return new Promise((resolve) => {
    if (!context.globalState.get(key)) {
      context.globalState.update(key, true).then(resolve);
    }
  });
}
