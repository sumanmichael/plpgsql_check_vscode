// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path = require('path');
import * as vscode from 'vscode';
import { CodelensProvider } from './codelens_provider';


const regex = /CREATE\s+(OR\s+REPLACE\s+)?(FUNCTION|PROCEDURE)\s+(.+)\s*\(([^\$]|\n)*(AS\s+\$.*$)/gim;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	const diagnosticCollection = vscode.languages.createDiagnosticCollection('plpgsql-check');
	
	const handler =async (doc:vscode.TextDocument) => {
		if(!doc.languageId.match(/sql/)) {
			return;
		}

		const diagnostics = await getDiagnostics(doc);
		diagnosticCollection.set(doc.uri, diagnostics);
	};

	const didOpen = vscode.workspace.onDidOpenTextDocument(handler);
	const didChange = vscode.workspace.onDidChangeTextDocument(e => handler(e.document));
	const codeLensProvider = vscode.languages.registerCodeLensProvider('sql', new CodelensProvider(regex));


	// If we have an activeTextEditor when we open the workspace, trigger the handler
	if (vscode.window.activeTextEditor) {
		await handler(vscode.window.activeTextEditor.document);
	}
	
	// Push all of the disposables that should be cleaned up when the extension is disabled
	context.subscriptions.push(
		diagnosticCollection,
		didOpen,
		didChange,
		codeLensProvider);
}

	
// this method is called when your extension is deactivated
export function deactivate() {}

async function getDiagnostics(doc: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
	const text = doc.getText();
	const diagnostics = new Array<vscode.Diagnostic>();

	let match;
	while ((match = regex.exec(text)) !== null) {
		const routineName = match[3];
		const delimiterStartToken = match[5];

		// get position of the delimiter start token
		const delimiterStartPosition = doc.positionAt(text.indexOf(delimiterStartToken)); 
		const delimiterStartLine = delimiterStartPosition.line;
		const jsonData = getPlpgsqlCheckJson(routineName);
		const issues = jsonData.issues;

		

		for (const issue of issues) {
			const message = issue.message;
			const severity = issue.level === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
			const errorLine =  doc.lineAt(delimiterStartLine + Number(issue.statement.lineNumber) - 1);
			const range = new vscode.Range(
				errorLine.range.start, errorLine.range.end
			);
			diagnostics.push(new vscode.Diagnostic(range, message, severity));
		}

	}

	return diagnostics;
}

function getPlpgsqlCheckJson(functionName: string): any {
	const jsonText = `
	{ "function":"24902",
	"issues":[
	  {
		"level":"error",
		"message":"record r has no field c",
		"statement":{
	"lineNumber":"6",
	"text":"RAISE"
	},
		"context":"SQL statement SELECT r.c",
		"sqlState":"42703"
	  }
	]
	}`;

	//parse jsonText to json
	let json = JSON.parse(jsonText);
	return json;
}
