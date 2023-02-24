// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Client, QueryResult } from "pg";
import * as vscode from "vscode";
import { SelectionCodeActions } from "./SelectionCodeActions";

const parser = require("pgsql-parser");

const client = getClient();
client.connect().catch((err) => {
  vscode.window.showErrorMessage("PL/pgSQL Checker: " + (err as Error).message);
});

// TODO: Do I need to end the client explicitly?
// await client.end();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("plpgsql-checker");

  let document = vscode.window.activeTextEditor?.document;

  const editorChangeHook = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor) {
        document = vscode.window.activeTextEditor?.document;
      }
    }
  );

  const clearAllDiagnosticsCommand = vscode.commands.registerCommand(
    "plpgsql-checker.clearAllDiagnostics",
    () => {
      diagnosticCollection.clear();
    }
  );

  const _runSelectedRoutineFunction = async (checkOnly = false) => {
    if (!document) {
      throw Error("Document Not Found");
    }
    const selectionObj = vscode.window.activeTextEditor?.selection;
    if (!selectionObj) {
      throw Error("Selection Invalid");
    }
    const selectedText = document.getText(selectionObj);
    if (!selectedText) {
      throw Error("Selected Text is Empty");
    }

    let stmts;
    try {
      stmts = parser.parse(selectedText);
    } catch (err) {
      throw new Error("Parse Error: " + (err as Error).message);
    }

    if (!checkOnly) {
      const res = await runQuery(selectedText);
      res.forEach((row, idx) => {
        vscode.window.showInformationMessage(
          `[${idx + 1}/${res.length}] ${row.command}`
        );
      });
    }

    for (let i = 0; i < stmts.length; i++) {
      if (stmts[i].RawStmt.stmt.CreateFunctionStmt) {
        const createStmt = stmts[i].RawStmt.stmt.CreateFunctionStmt;
        const routineName = createStmt.funcname.map((name: any) => name.String.str).join(".");

        const createStmtWithLeftSpacesOffset = stmts[i].RawStmt.stmt_location;

        const createStmtWithLeftSpacesText = selectedText.slice(
          createStmtWithLeftSpacesOffset
        );

        const leftSpacesCountInCreateStmt =
          createStmtWithLeftSpacesText.length -
          createStmtWithLeftSpacesText.trimLeft().length;

        const routineBlockStartPos = document.positionAt(
          document.offsetAt(selectionObj.start) +
            createStmtWithLeftSpacesOffset +
            leftSpacesCountInCreateStmt
        );
        const bodyStartFromSelectionOffset = (
          createStmt.options as any[]
        ).filter((value) => value.DefElem.defname === "as")[0].DefElem.location;

        const bodyStartPos = document.positionAt(
          document.offsetAt(selectionObj.start) + bodyStartFromSelectionOffset
        );
        const createStmtHeaderRange = new vscode.Range(
          routineBlockStartPos,
          bodyStartPos
        );
        const definitionLine = document.lineAt(
          document.positionAt(
            document.offsetAt(selectionObj.start) + bodyStartFromSelectionOffset
          ).line + 1
        );
        const diagnostics = await getDiagnosticsForRoutine(
          document,
          routineName,
          createStmtHeaderRange,
          definitionLine!
        );
        diagnosticCollection.set(document.uri, diagnostics);
      }
    }
  };

  const runSelectedRoutineFunction = async (checkOnly = false) => {
    _runSelectedRoutineFunction(checkOnly).catch((err) => {
      let message = `${err.message} `;
      if (err.detail) {
        message += `\nDetail: (${err.detail}) `;
      }
      if (err.hint) {
        message += `\nHint: (${err.hint}) `;
      }
      if (err.context) {
        message += `\nContext: (${err.context}) `;
      }
      vscode.window.showErrorMessage("PL/pgSQL Checker: " + message);
    });
  };

  const runSelectedRoutineCommand = vscode.commands.registerCommand(
    "plpgsql-checker.runAndCheckSelectedRoutine",
    runSelectedRoutineFunction
  );

  const checkSelectedRoutineCommand = vscode.commands.registerCommand(
    "plpgsql-checker.checkSelectedRoutine",
    () => {
      runSelectedRoutineFunction(true);
    }
  );

  const codeActionProvider = vscode.languages.registerCodeActionsProvider(
    "sql",
    new SelectionCodeActions()
  );

  // Push all of the disposables that should be cleaned up when the extension is disabled
  context.subscriptions.push(
    diagnosticCollection,
    editorChangeHook,
    codeActionProvider,

    clearAllDiagnosticsCommand,
    runSelectedRoutineCommand,
    checkSelectedRoutineCommand
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function getDiagnosticsForRoutine(
  document: vscode.TextDocument,
  routineName: string,
  routineDeclarationRange: vscode.Range,
  definitionLine: vscode.TextLine
): Promise<vscode.Diagnostic[]> {
  const diagnostics = new Array<vscode.Diagnostic>();

  const jsonData = await getPlpgsqlCheckJson(routineName);

  if (jsonData instanceof vscode.Diagnostic) {
    return [jsonData];
  }

  for (const row of jsonData) {
    let message = `${row.message} `;
    if (row.detail) {
      message += `Detail: (${row.detail}) `;
    }
    if (row.hint) {
      message += `Hint: (${row.hint}) `;
    }
    if (row.context) {
      message += `Context: (${row.context}) `;
    }

    if (row.statement) {
      message += `[${row.statement}]`;
    }

    const severity =
      row.level === "error"
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning;

    let range;
    if (row.lineno) {
      const queryLine = document.lineAt(
        routineDeclarationRange.end.line + row.lineno - 1
      );
      const charQueryOffset =
        queryLine.firstNonWhitespaceCharacterIndex + row.position;
      const diagPos = document.positionAt(
        document.offsetAt(queryLine.range.start) + charQueryOffset
      );
      const diagWordRange = document.getWordRangeAtPosition(diagPos);

      if (!diagWordRange || diagWordRange.isEmpty) {
        range = queryLine.range;
      } else {
        range = diagWordRange;
      }
    } else {
      range = routineDeclarationRange;
    }
    const diag = new vscode.Diagnostic(range, message, severity);
    if (row.sqlstate) {
      diag.code = row.sqlstate;
    }
    diag.source = 'plpgsql-checker';
    // code = row.sqlstate
    diagnostics.push(diag);
  }

  return diagnostics;
}

async function getPlpgsqlCheckJson(functionName: string): Promise<any> {
  const fatalErrors = vscode.workspace
    .getConfiguration("plpgsql-checker")
    .get("fatalErrorsEnabled");
  const res = await client.query(
    "SELECT * FROM plpgsql_check_function_tb($1, fatal_errors := $2)",
    [functionName, fatalErrors]
  );
  return res.rows;
}

async function runQuery(query: string): Promise<Array<QueryResult>> {
  const res = await client.query(query);
  if (res instanceof Array) {
    return res;
  } else {
    return [res];
  }
}

function getClient(): Client {
  const config = vscode.workspace.getConfiguration("plpgsql-checker.config");
  return new Client({
    user: config.get("user"),
    password: config.get("password"),
    host: config.get("host"),
    port: config.get("port"),
    database: config.get("database"),
  });
}
