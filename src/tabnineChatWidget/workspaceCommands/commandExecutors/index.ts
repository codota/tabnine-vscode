export interface CommandExecutor {
  execute: (arg: string) => Promise<string[] | undefined>;
}
