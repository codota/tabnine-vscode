if ! command -v vsce &> /dev/null
then
  echo "installing vsce"
  npm install -g @vscode/vsce
fi

if ! command -v jq &> /dev/null
then
  echo "installing jq"
  if [  -n "$(uname | grep darwin)" ]; then
    brew install jq
  else
    sudo apt-get install jq
  fi
  sudo apt-get install jq
  npm install -g @vscode/vsce
fi

yarn onprem:prep \
&& yes | vsce package \
&& yarn onprem:reset