#!/bin/sh
set -e

# This script downloads the binaries for the most recent version of TabNine.

version="$(curl -sS https://update.tabnine.com/version)"
targets='i686-pc-windows-gnu
    i686-unknown-linux-musl
    x86_64-apple-darwin
    x86_64-pc-windows-gnu
    x86_64-unknown-linux-musl'

rm -rf ./binaries

echo "$targets" | while read target
do
    mkdir -p binaries/$version/$target
    case $target in
        *windows*) exe=TabNine.exe ;;
        *) exe=TabNine ;;
    esac
    path=$version/$target/$exe
    echo "downloading $path"
    curl -sS https://update.tabnine.com/$path > binaries/$path
    chmod +x binaries/$path
done

binariesver=$(grep -Eo '!binaries/.*' .gitignore | cut -c10-)
sed "s+$binariesver+/$version+g" .gitignore >.gitignore.tmp && mv .gitignore.tmp .gitignore