export type SaveSnippetRequest = {
  code: string;
  filename: string;
  start_offset: number;
  end_offset: number;
};

export type SuccessSaveSnippetResponse = "Success";

export type ErrorSaveSnippetResponse = {
  Error: string;
};

export type SaveSnippetResponse =
  | SuccessSaveSnippetResponse
  | ErrorSaveSnippetResponse;
