# PL/pgSQL Checker for VSCode

Plpgsql-checker is a powerful extension for Visual Studio Code that enables developers to run checks on procedures and functions written in PL/pgSQL language using the [plpgsql_check](https://github.com/okbob/plpgsql_check) PostgreSQL extension. PL/pgSQL is a procedural programming language used to develop stored procedures, functions, and triggers in PostgreSQL databases.

The plpgsql_check extension provides a way to check the syntax and performance of PL/pgSQL code. It is a valuable tool for developers to identify potential issues in their code and optimize its performance.

Plpgsql-checker extension is designed to integrate seamlessly with Visual Studio Code, providing a convenient and user-friendly interface for running PL/pgSQL code checks. The extension allows developers to highlight any PL/pgSQL code within their text editor and run the plpgsql_check command with just a few clicks.

With plpgsql-checker, developers can perform syntax checks to detect errors and warnings in their code, as well as run performance checks to identify potential bottlenecks and optimize the code accordingly. The extension displays the results of these checks directly in the Visual Studio Code interface, making it easy for developers to identify and resolve issues quickly.

In summary, the plpgsql-checker extension for Visual Studio Code is an essential tool for developers working with PostgreSQL databases and PL/pgSQL code. It provides an efficient and effective way to identify and address issues in code, leading to better performance and more reliable database applications.

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

