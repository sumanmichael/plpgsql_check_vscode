# PL/pgSQL Checker for VSCode

> Note: This extension, doesn't work on Windows. See https://github.com/pyramation/pgsql-parser/issues/95#issuecomment-1376730703, https://github.com/pganalyze/libpg_query/issues/44

## Install the extension

```console
npm install
```

## Install Visual Studio Code Extension Manager (vsce) to build the .vsix file

> This project uses `keytar` which uses `libsecret`. So, Depending on your distribution, you will need to run the following command:
> - Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
> - Alpine: `apk add libsecret`
> - Red Hat-based: `sudo yum install libsecret-devel`
> - Arch Linux: `sudo pacman -S libsecret`

Now, Install vsce globally
```console
npm install --global @vscode/vsce
```

## Build Extension (.vsix file)

```console
vsce package
```

## Install Extension using .vsix file

https://code.visualstudio.com/docs/editor/extension-marketplace#_install-an-extension:~:text=find%20helpful%20tags.-,Install%20from%20a%20VSIX,-You%20can%20manually

