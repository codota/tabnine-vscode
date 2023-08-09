export function toSnakeCase(str: string): string {
  return str
    .replace(/(?<=[a-z])[A-Z]/g, (letter) => `_${letter}`)
    .toLowerCase();
}

export function toCamelCase(str: string): string {
  return str.replace(/_(.)/g, (_match, group1: string) => group1.toUpperCase());
}
