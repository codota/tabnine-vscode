if ! command -v vsce &> /dev/null
then
  echo "installing vsce"
  npm install -g @vscode/vsce
fi
yarn onprem:prep \
&& yes | vsce package \
&& yarn onprem:reset