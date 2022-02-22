import { CancellationToken, CodeAction, CodeActionContext, CodeActionKind, CodeActionProvider, Command, ProviderResult, Range, Selection, TextDocument } from "vscode";

export class SelectionCodeActions implements CodeActionProvider{
    provideCodeActions(document: TextDocument, range: Range | Selection, context: CodeActionContext, token: CancellationToken): ProviderResult<(CodeAction | Command)[]> {
        if(!range.isEmpty){
            const runAndCheckSelectedCodeAction = new CodeAction("Run and Check Selected PL/pgSQL code",CodeActionKind.Empty);
            runAndCheckSelectedCodeAction.command = {
                command: "plpgsql-checker.runAndCheckSelectedRoutine", 
                title: "Run and Check PL/pgSQL code",
                tooltip: "Run Selected Code in Database and Check through PL/pgSQL-Check ",
            };

            const checkSelectedCodeAction = new CodeAction("Check Selection PL/pgSQL code",CodeActionKind.Empty);
            checkSelectedCodeAction.command = {
                command: "plpgsql-checker.checkSelectedRoutine",
                title: "Check PL/pgSQL code",
                tooltip: "Check Selected Code through PL/pgSQL-Check ",
            };
            
            return [runAndCheckSelectedCodeAction,checkSelectedCodeAction];
        }
        return [];
    }
}