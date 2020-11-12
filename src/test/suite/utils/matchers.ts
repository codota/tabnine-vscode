import * as path from "path";
import { AutocompleteRequest } from "./completion.utils";

// Example autocomplete query:
//   '{"version":"2.0.2","request":{"Autocomplete":{"filename":"/Users/boazberman/Projects/Codota/tabnine-vscode/out/test/fixture/completion.txt","before":"blabla","after":"","region_includes_beginning":true,"region_includes_end":true,"max_num_results":5}}}\n';

// eslint-disable-next-line import/prefer-default-export
export function matchesAutocompleteRequest(request: string): boolean {
  const completionRequest = JSON.parse(request) as AutocompleteRequest;

  return (
    request.endsWith("\n") &&
    completionRequest?.version === "2.0.2" &&
    completionRequest?.request?.Autocomplete?.filename?.endsWith(
      path.join("test", "fixture", "completion.txt")
    ) &&
    completionRequest?.request?.Autocomplete?.after === "" &&
    completionRequest?.request?.Autocomplete?.before === "blabla" &&
    completionRequest?.request?.Autocomplete?.region_includes_beginning &&
    completionRequest?.request?.Autocomplete?.region_includes_end &&
    completionRequest?.request?.Autocomplete?.max_num_results === 5
  );
}
