import * as vscode from 'vscode';
import type {
  CompletionItem as LspItem,
  CompletionSettings,
  Range as LspRange,
} from 'vscode-css-languageservice';
import { completeInBlock } from './complete.ts';
import { registerSetUp } from './setup.ts';

const languages = [
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
  'astro',
  'html',
];

export function activate(context: vscode.ExtensionContext) {
  registerSetUp(context);
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      languages,
      { provideCompletionItems },
      // VS Code's CSS extension's triggers, plus `@` for at-rules and `&` for nesting.
      '/',
      '-',
      ':',
      '@',
      '&',
    ),
  );
}

function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
): vscode.CompletionList | undefined {
  const result = completeInBlock(
    document.getText(),
    document.offsetAt(position),
    document.languageId === 'html',
    (language) =>
      vscode.workspace.getConfiguration(language, document).get<CompletionSettings>('completion'),
  );
  if (!result) return undefined;
  return new vscode.CompletionList(result.list.items.map(toItem), result.list.isIncomplete);
}

const toRange = (r: LspRange) =>
  new vscode.Range(r.start.line, r.start.character, r.end.line, r.end.character);

function toItem(item: LspItem): vscode.CompletionItem {
  // LSP's kinds start at 1, VS Code's at 0.
  const out = new vscode.CompletionItem(item.label, item.kind && item.kind - 1);
  out.detail = item.detail;
  out.sortText = item.sortText;
  out.filterText = item.filterText;
  out.preselect = item.preselect;
  // LSP's and VS Code's tags share values (Deprecated is 1 in both).
  out.tags = item.tags as vscode.CompletionItemTag[] | undefined;
  const doc = item.documentation;
  out.documentation =
    typeof doc !== 'object'
      ? doc
      : doc.kind === 'markdown'
        ? new vscode.MarkdownString(doc.value)
        : doc.value;
  const edit = item.textEdit;
  const text = edit?.newText ?? item.insertText ?? item.label;
  // 2 is InsertTextFormat.Snippet.
  out.insertText = item.insertTextFormat === 2 ? new vscode.SnippetString(text) : text;
  if (edit) {
    out.range =
      'range' in edit
        ? toRange(edit.range)
        : { inserting: toRange(edit.insert), replacing: toRange(edit.replace) };
  }
  if (item.command) {
    out.command = {
      title: item.command.title,
      command: item.command.command,
      arguments: item.command.arguments,
    };
  }
  return out;
}
