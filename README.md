# Project for testing open source code completion models

It was forked from [tabnine-vscode](https://github.com/codota/tabnine-vscode) & modified for making it compatible with open sorurce code models on hf.co/models

## Installing

Install just like any other [vscode extension](https://marketplace.visualstudio.com/items?itemName=HuggingFace.huggingface-vscode).

### However, if you installed dev version from src before, please follow step below:

Step 1: Uninstall previous version if you have already installed huggingface-vscode under VSCode Extensions tab.

Because it was a fork of [tabnine-vscode](https://github.com/codota/tabnine-vscode), in some previous versions, this extension will appear as `Tabnine AI Autocomplete`. 

Clik `Uninstall` & click `Reload` to take in effect.


<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-uninstall.png" width="800px">

Step 2: Insall

[Install through vscode](#installing)

If the installation was successful, you will see in VSCode Extensions tab: 
<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-install.png" width="800px">

## Testing

1. Create a new python file
2. Try typing `def main():`

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-working.png" width="800px">

## Checking output

You can see input to & output from the code generation API:

1. Open VSCode `OUTPUT` panel
2. Choose `Hugging Face Code`

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-output.png" width="800px">