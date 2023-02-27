# Project for testing open source code completion models

It was forked from [tabnine-vscode](https://github.com/codota/tabnine-vscode).

## Installing

Step 1: Uninstall previous version if you have already installed huggingface-vscode under VSCode Extensions tab.

Because it was a fork of [tabnine-vscode](https://github.com/codota/tabnine-vscode), in some previous versions, this extension will appear as `Tabnine AI Autocomplete`. 

Clik `Uninstall` & click `Reload` to take in effect.


<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-uninstall.png" width="800px">

Step 2: Insall

```bash
# step 1: git clone with depth==1 for faster checkout
git clone https://github.com/huggingface/huggingface-vscode --depth 1
# step 2: install the extension
cd huggingface-vscode
code --install-extension huggingface-vscode-0.0.1.vsix
```

If the installation was successful, you will see in VSCode Extensions tab: 
<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-install.png" width="800px">

## Testing

1. Create a new python file
2. Try typing `def main():`

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-working.png" width="800px">

You can see input to & output from the code generation API:

<img src="https://github.com/huggingface/huggingface-vscode/raw/master/assets/ext-output.png" width="800px">