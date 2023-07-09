import executeWorkspaceCommand, {
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
  const results = await Promise.all(
    workspaceCommands.map(executeWorkspaceCommand)
  );

  results.forEach((result) => {
    if (!result) return;
    if (result.command === "findSymbols") {
      workspaceData.symbols = (workspaceData?.symbols ?? []).concat(
        result.data
      );
    }
  });

  return workspaceData;
}
