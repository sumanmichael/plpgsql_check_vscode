// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path = require("path");
import * as vscode from "vscode";
import { CodelensProvider } from "./codelens_provider";
import { Client, Query, QueryResult } from "pg";

const regex =
  /(CREATE\s+(OR\s+REPLACE\s+)?(FUNCTION|PROCEDURE)\s+(.+)\s*\(.*\)([^\$]|\n)*)(AS\s+\$.*\$)/gim;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("plpgsql-check");

  let document = vscode.window.activeTextEditor?.document;



  const checkRoutineFunction = async (
    functionName: string,
    routineBlockStartLine: vscode.TextLine,
    definitionLine: vscode.TextLine
  ) => {
    if (document) {
      diagnosticCollection.set(
        document.uri,
        await getDiagnosticsForRoutine(
          document,
          functionName,
          routineBlockStartLine,
          definitionLine
        )
      );
    } else {
      diagnosticCollection.clear();
    }
  };

  const checkRoutineCommand = vscode.commands.registerCommand(
    "plpgsql-checker.checkRoutine",
    checkRoutineFunction
  );

  const clearRoutineDiagnosticsCommand = vscode.commands.registerCommand(
    "plpgsql-checker.clearAllDiagnostics",
    () => {
      diagnosticCollection.clear();
    }
  );

  const runSelectedRoutineFunction = async () => {
    const selectionObj = vscode.window.activeTextEditor?.selection;
    if (selectionObj) {
      const selectedText =
        vscode.window.activeTextEditor?.document.getText(selectionObj);
      if (selectedText) {
        const res = await runQuery(selectedText);
        vscode.window.showInformationMessage(res.command);
      } else {
        vscode.window.showErrorMessage("Please select a text to run");
      }
    } else {
      vscode.window.showErrorMessage("Please select a text to run");
    }
  };

  const runSelectedRoutineCommand = vscode.commands.registerCommand(
    "plpgsql-checker.runSelectedRoutine",
    runSelectedRoutineFunction
  );

  const checkAllRoutinesCommand = vscode.commands.registerCommand(
    "plpgsql-checker.checkAllRoutines",
    (argumentsList: Array<[string, vscode.TextLine, vscode.TextLine]>) => {
      updateAllDiagnostics(document, diagnosticCollection, argumentsList);
    }
  );

  const runAndCheckRoutineCommand = vscode.commands.registerCommand(
    "plpgsql-checker.runAndCheckSelectedRoutine",
    async (
      functionName: string,
      routineBlockStartLine: vscode.TextLine,
      definitionLine: vscode.TextLine
    ) => {
      await runSelectedRoutineFunction();
      checkRoutineFunction(functionName, routineBlockStartLine, definitionLine);
    }
  );

  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    "sql",
    new CodelensProvider(regex)
  );
  
  const editorChangeHook = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
       document = vscode.window.activeTextEditor?.document;
    }
  });

  // Push all of the disposables that should be cleaned up when the extension is disabled
  context.subscriptions.push(
    diagnosticCollection,
    checkRoutineCommand,
    clearRoutineDiagnosticsCommand,
    codeLensProvider,
    checkAllRoutinesCommand,
    editorChangeHook,
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function updateAllDiagnostics(
  document: vscode.TextDocument | undefined,
  collection: vscode.DiagnosticCollection,
  argumentsList: Array<[string, vscode.TextLine, vscode.TextLine]>
): Promise<void> {
  if (document) {
    const diagnostics = argumentsList.map((argument) =>
      getDiagnosticsForRoutine(document, ...argument).catch((err) => [
        new vscode.Diagnostic(
          new vscode.Range(
            document.lineAt(argument[2].lineNumber).range.start,
            document.lineAt(argument[2].lineNumber).range.end
          ),
          err.message,
          vscode.DiagnosticSeverity.Error
        ),
      ])
    );
    const diagnosticsList = await Promise.all(diagnostics);
    collection.set(document.uri, diagnosticsList.flat());
  } else {
    collection.clear();
  }
}

async function getDiagnosticsForRoutine(
  document: vscode.TextDocument,
  routineName: string,
  routineBlockStartLine: vscode.TextLine,
  definitionLine: vscode.TextLine
): Promise<vscode.Diagnostic[]> {
  const diagnostics = new Array<vscode.Diagnostic>();

  const jsonData = await getPlpgsqlCheckJson(routineName).catch(
    (err) =>
      new vscode.Diagnostic(
        new vscode.Range(
          document.lineAt(definitionLine.lineNumber).range.start,
          document.lineAt(definitionLine.lineNumber).range.end
        ),
        err.message,
        vscode.DiagnosticSeverity.Error
      )
  );

  if (jsonData instanceof vscode.Diagnostic) {
    return [jsonData];
  }

  for (const row of jsonData) {
    const message = row.message;
    const severity =
      row.level === "error"
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning;
    const relativeLineNumber = row.lineno;
    const absLineNumber =
      routineBlockStartLine.lineNumber + relativeLineNumber - 1;
    const absLine = document.lineAt(absLineNumber);
    const range = new vscode.Range(absLine.range.start, absLine.range.end);

    diagnostics.push(new vscode.Diagnostic(range, message, severity));
  }

  return diagnostics;
}

async function getPlpgsqlCheckJson(functionName: string): Promise<any> {
  const client = getClient();
  await client.connect();

  const res = await client.query(
    "SELECT * FROM plpgsql_check_function_tb($1, fatal_errors := false)",
    [functionName]
  );
  await client.end();
  return res.rows;
}

async function runQuery(query: string): Promise<QueryResult> {
  const client = getClient();
  await client.connect();

  const res = await client.query(query);
  await client.end();
  return res;
}

function getClient(): Client {
  return new Client({
    user: vscode.workspace.getConfiguration("plpgsql-checker.config").get("user"),
    password: vscode.workspace.getConfiguration("plpgsql-checker.config").get("password"),
    host: vscode.workspace.getConfiguration("plpgsql-checker.config").get("host"),
    port: vscode.workspace.getConfiguration("plpgsql-checker.config").get("port"),
    database: vscode.workspace.getConfiguration("plpgsql-checker.config").get("database"),
  });
}
