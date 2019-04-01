import * as vscode from 'vscode';
import { LanguageClient, WorkspaceEdit } from 'vscode-languageclient';
import { generateGrammarCommandHandler } from './generate_grammar';
import { registerLanguageConfigurations } from './languages';
import { initializeLanguageClient } from './client';
import { join } from 'path';

export function activate(context: vscode.ExtensionContext) {
  /**
   * Custom Block Grammar generation command
   */
  context.subscriptions.push(
    vscode.commands.registerCommand('vetur.generateGrammar', generateGrammarCommandHandler(context.extensionPath))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vetur.applyWorkspaceEdits', (args: WorkspaceEdit) => {
      const edit = client.protocol2CodeConverter.asWorkspaceEdit(args)!;
      vscode.workspace.applyEdit(edit);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vetur.chooseTypeScriptRefactoring', (args: any) => {
      client
        .sendRequest<vscode.Command | undefined>('requestCodeActionEdits', args)
        .then(command => command && vscode.commands.executeCommand(command.command, ...command.arguments!));
    })
  );

  registerLanguageConfigurations();

  /**
   * Vue Language Server Initialization
   */

  const serverModule = context.asAbsolutePath(join('server', 'dist', 'vueServerMain.js'));
  const client = initializeLanguageClient(serverModule);
  context.subscriptions.push(client.start());

  client
    .onReady()
    .then(() => {
      registerCustomClientNotificationHandlers(client);
    })
    .catch(e => {
      console.log('Client initialization failed');
    });
}

function registerCustomClientNotificationHandlers(client: LanguageClient) {
  client.onNotification('$/displayInfo', (msg: string) => {
    vscode.window.showInformationMessage(msg);
  });
  client.onNotification('$/displayWarning', (msg: string) => {
    vscode.window.showWarningMessage(msg);
  });
  client.onNotification('$/displayError', (msg: string) => {
    vscode.window.showErrorMessage(msg);
  });
}
