import * as vscode from "vscode";
/**
 * CodelensProvider
 */

export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(regex: RegExp) {
    this.regex = regex;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (
      vscode.workspace
        .getConfiguration("plpgsql-checker")
        .get("enableCodeLens", true)
    ) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      const checkRoutineArgumentList = new Array<[string, vscode.TextLine, vscode.TextLine]>();
      let matches;
      while ((matches = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(matches.index).line);
        const range = new vscode.Range(line.range.start, line.range.end);
        const checkRoutineArgument = <[string, vscode.TextLine, vscode.TextLine]> [
          matches[4],
          document.lineAt(
            document.positionAt(matches.index + matches[1].length)
          ),
          document.lineAt(
            document.positionAt(matches.index)
          )
        ];
        checkRoutineArgumentList.push(checkRoutineArgument);
        if (range) {
            this.codeLenses.push(
                new vscode.CodeLens(range, {
                  title: "Run and Check Selected ▶", 
                  tooltip: "Run and Check Selected",
                  command: "plpgsql-checker.runAndCheckSelectedRoutine",
                  arguments: checkRoutineArgument,
                })
              );
          this.codeLenses.push(
            new vscode.CodeLens(range, {
              title: "Check Only >",
              tooltip: "Check the Function/Procedure using plpgsql_check",
              command: "plpgsql-checker.checkRoutine",
              arguments: checkRoutineArgument,
            })
          );
          this.codeLenses.push(
            new vscode.CodeLens(range, {
              title: "Run Selected ▷", 
              tooltip: "Run Selected",
              command: "plpgsql-checker.runSelectedRoutine",
              arguments: [],
            })
          );
        }
      }
      const docStartRange = new vscode.Range(0, 0, 0, 0);

      this.codeLenses.push(
        new vscode.CodeLens(docStartRange, {
          title: "Check All >>",
          tooltip: "Check All Routines",
          command: "plpgsql-checker.checkAllRoutines",
          arguments: [checkRoutineArgumentList],
        })
      );
      
      this.codeLenses.push(
        new vscode.CodeLens(docStartRange, {
          title: "Run Selected ▷▷",
          tooltip: "Run Selected",
          command: "plpgsql-checker.runSelectedRoutine",
          arguments: [],
        })
      );
        
      this.codeLenses.push(
        new vscode.CodeLens(docStartRange, {
          title: "Clear All ⨉",
          tooltip: "Clear suggestions from plpgsql_check",
          command: "plpgsql-checker.clearAllDiagnostics",
          arguments: [],
        })
      );
      return this.codeLenses;
    }
    return [];
  }
}
