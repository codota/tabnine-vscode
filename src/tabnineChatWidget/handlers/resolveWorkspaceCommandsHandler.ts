import executeWorkspaceCommand, {
  ExecutionResult,
  WorkspaceCommandInstruction,
} from "../workspaceCommands";

export type ResolveWorkspaceCommandsRequest = {
  workspaceCommands: WorkspaceCommandInstruction[];
};

export type WorkspaceData = {
  symbols?: string[];
};

export default async function resolveWorkspaceCommands({
  workspaceCommands,
}: ResolveWorkspaceCommandsRequest): Promise<WorkspaceData | undefined> {
  if (!workspaceCommands || !workspaceCommands.length) return undefined;

  const workspaceData: WorkspaceData = {
    symbols: undefined,
  };
  const results = await Promise.allSettled(
    workspaceCommands.map(executeWorkspaceCommand)
  );

  results
    .filter((result) => {
      if (result.status === "fulfilled") return true;

      const err = result.reason as string;
      console.error(err);
      return false;
    })
    .map(
      (result) => result as PromiseFulfilledResult<ExecutionResult | undefined>
    )
    .forEach(({ value }) => {
      if (!value) return;
      if (value.command === "findSymbols") {
        workspaceData.symbols = (workspaceData?.symbols ?? []).concat(
          value.data
        );
      }
    });

  return workspaceData;
}
