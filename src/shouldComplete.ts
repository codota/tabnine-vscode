let shouldComplete = false;

export function setShouldComplete(should: boolean): void {
  shouldComplete = should;
}

export function clearShouldComplete(): void {
  shouldComplete = false;
}
export function getShouldComplete(): boolean {
  return shouldComplete;
}
