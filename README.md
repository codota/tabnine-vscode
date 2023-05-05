# Project for testing open source code completion models

It was forked from [tabnine-vscode](https://github.com/codota/tabnine-vscode) & modified for making it compatible with open source code models on [hf.co/models](hf.co/models)

## Installing

Install just like any other [vscode extension](https://marketplace.visualstudio.com/items?itemName=HuggingFace.huggingface-vscode).

Be default, this extension is using [bigcode/starcoder](https://huggingface.co/bigcode/starcoder) & [Hugging Face Inference API](https://huggingface.co/inference-api) for the inference. However, you can [configure](#configuring) to make inference requests to your custom endpoint that is not Hugging Face Inference API. Thus, if you are using the default Hugging Face Inference AP inference, you'd need to provide [HF API Token](#hf-api-token).

#### HF API token

You can supply your HF API token ([hf.co/settings/token](https://hf.co/settings/token)) with this command:

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/set-api-token.png" width="800px">

## Testing

1. Create a new python file
2. Try typing `def main():`

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-working.png" width="800px">

#### Checking if the generated code in in [The Stack](https://huggingface.co/datasets/bigcode/the-stack)

Hit `Ctrl+Esc` to check if the generated code is in in [The Stack](https://huggingface.co/datasets/bigcode/the-stack).
This is a rapid first-pass attribution check using [stack.dataportraits.org](https://stack.dataportraits.org).
We check for sequences of at least 50 characters that match a Bloom filter.
This means false positives are possible and long enough surrounding context is necesssary (see the [paper](https://dataportraits.org/) for details on n-gram striding and sequence length).
[The dedicated Stack search tool](https://hf.co/spaces/bigcode/search) is a full dataset index and can be used for a complete second pass. 


## Developing
Make sure you've [installed yarn](https://yarnpkg.com/getting-started/install) on your system.
1. Clone this repo: `git clone https://github.com/huggingface/huggingface-vscode`
2. Install deps: `cd huggingface-vscode && yarn install --frozen-lockfile`
3. In vscode, open `Run and Debug` side bar & click `Launch Extension`

## Checking output

You can see input to & output from the code generation API:

1. Open VSCode `OUTPUT` panel
2. Choose `Hugging Face Code`

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-output.png" width="800px">

## Configuring

You can configure: endpoint to where request will be sent and special tokens.

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/set-configs.png" width="800px">

Example:

Let's say your current code is this:
```py
import numpy as np
import scipy as sp
{YOUR_CURSOR_POSITION}
def hello_word():
    print("Hello world")
```

Then, the request body will look like:
```js
const inputs = `{start token}import numpy as np\nimport scipy as sp\n{middle token}def hello_word():\n    print("Hello world"){end token}`
const data = {inputs, parameters:{max_new_tokens:256}};

const res = await fetch(endpoint, {
    body: JSON.stringify(data),
    headers,
    method: "POST"
});
```
