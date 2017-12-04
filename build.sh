#!/bin/bash

# This build script bundles all necessary files to a zip, ready to be signed by AMO (firefox)
# And a *.crx extension for chrome incl. pem private key for updates

#google-chrome --pack-extension="src" --pack-extension-key="src.pem" --no-message-box

mkdir -p dist

name="weblink"
path="src"
key="weblink.pem" #private key to update crx
zip="dist/$name.zip"

# zip up the path (firefox)
cwd=$(pwd -P)
(cd "$path" && zip -qr -9 "$cwd/$zip" .)
echo "Wrote $zip"

# (chrome)
./crxmake.sh "$path" "$key" "$name"