# PL/pgSQL Checker for VSCode

Install the extension

```console
npm install
```

Install Visual Studio Code Extension Manager (vsce) to build the .vsix file

This project uses `keytar` which uses `libsecret`. So, Depending on your distribution, you will need to run the following command:

- Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
- Alpine: `apk add libsecret`
- Red Hat-based: `sudo yum install libsecret-devel`
- Arch Linux: `sudo pacman -S libsecret`

Now, Install vsce globally
```console
npm install --global @vscode/vsce
```

