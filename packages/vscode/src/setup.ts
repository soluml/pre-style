import * as vscode from 'vscode';
import { parse } from 'jsonc-parser';
import {
  addContentMapper,
  hasContentMapper,
  hasWildcardDeclaration,
  removeWildcardDeclarations,
  supportsContentMappers,
  usesPreStyle,
  WILDCARD_DECLARATION,
} from './mapper.ts';

export const SET_UP_COMMAND = 'pre-style.setUpTypes';
const DISMISSED = 'pre-style.setUpTypes.dismissed';
const STYLESHEET_IMPORT = /\btype\s*:\s*(["'])pre\.style\1/;

interface Project {
  tsconfig: vscode.Uri;
  dir: vscode.Uri;
  /** The project's installed TypeScript version. */
  typescript: string;
  mapper: boolean;
  /** Declaration files with `declare module "*.css"` or `"*.scss"`. */
  wildcards: vscode.Uri[];
}

const decoder = new TextDecoder();

async function read(uri: vscode.Uri): Promise<string | undefined> {
  try {
    return decoder.decode(await vscode.workspace.fs.readFile(uri));
  } catch {
    return undefined;
  }
}

/** The nearest `path` in `dir` or its ancestors, up to the workspace folder. */
async function nearest(dir: vscode.Uri, path: string) {
  const root = vscode.workspace.getWorkspaceFolder(dir)?.uri.path ?? '/';
  for (let d = dir; ; d = vscode.Uri.joinPath(d, '..')) {
    const uri = vscode.Uri.joinPath(d, path);
    const text = await read(uri);
    if (text !== undefined) return { uri, text };
    if (d.path === root || d.path === '/' || !d.path.startsWith(root)) return undefined;
  }
}

const isDone = (p: Project) =>
  supportsContentMappers(p.typescript) ? p.mapper && !p.wildcards.length : p.wildcards.length > 0;

async function loadProject(tsconfig: vscode.Uri): Promise<Project | undefined> {
  const dir = vscode.Uri.joinPath(tsconfig, '..');
  const pkg = await nearest(dir, 'package.json');
  if (!pkg || !usesPreStyle(pkg.text)) return undefined;
  const ts = await nearest(dir, 'node_modules/typescript/package.json');
  const typescript = ts && parse(ts.text)?.version;
  if (typeof typescript !== 'string') return undefined;
  let mapper = false;
  try {
    mapper = hasContentMapper((await read(tsconfig)) ?? '');
  } catch {
    // Not valid JSON: setting up reports it.
  }
  const declarations = await vscode.workspace.findFiles(
    new vscode.RelativePattern(dir, '**/*.d.ts'),
    '**/{node_modules,dist,.astro}/**',
  );
  const wildcards: vscode.Uri[] = [];
  for (const uri of declarations) {
    if (hasWildcardDeclaration((await read(uri)) ?? '')) wildcards.push(uri);
  }
  return { tsconfig, dir, typescript, mapper, wildcards };
}

async function findProjects(): Promise<Project[]> {
  const tsconfigs = await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**');
  const projects = await Promise.all(tsconfigs.map(loadProject));
  return projects.filter((p) => p !== undefined);
}

/** Sets up one project, and returns a message saying what changed. */
async function setUp(project: Project): Promise<string | undefined> {
  const edit = new vscode.WorkspaceEdit();
  const changed: vscode.Uri[] = [];
  const name = vscode.workspace.asRelativePath(project.tsconfig);

  async function replace(uri: vscode.Uri, text: string) {
    const doc = await vscode.workspace.openTextDocument(uri);
    edit.replace(uri, new vscode.Range(0, 0, doc.lineCount, 0), text);
    changed.push(uri);
  }

  if (!supportsContentMappers(project.typescript)) {
    const src = vscode.Uri.joinPath(project.dir, 'src');
    const hasSrc = await vscode.workspace.fs.stat(src).then(
      (s) => s.type === vscode.FileType.Directory,
      () => false,
    );
    const file = vscode.Uri.joinPath(hasSrc ? src : project.dir, 'stylesheets.d.ts');
    edit.createFile(file, { contents: new TextEncoder().encode(WILDCARD_DECLARATION) });
    if (!(await vscode.workspace.applyEdit(edit))) {
      void vscode.window.showErrorMessage(
        `pre.style: couldn't create ${vscode.workspace.asRelativePath(file)}.`,
      );
      return undefined;
    }
    return `Added ${vscode.workspace.asRelativePath(file)} for TypeScript ${project.typescript}. Use namespace imports (import * as styles) from stylesheet files until TypeScript 7.1, which types named imports.`;
  }

  const doc = await vscode.workspace.openTextDocument(project.tsconfig);
  try {
    if (!project.mapper) await replace(project.tsconfig, addContentMapper(doc.getText()));
  } catch {
    void vscode.window.showErrorMessage(
      `pre.style: ${name} isn't valid JSON, so it wasn't changed.`,
    );
    return undefined;
  }

  let kept = false;
  if (project.wildcards.length) {
    const files = project.wildcards.map((u) => vscode.workspace.asRelativePath(u)).join(', ');
    const choice = await vscode.window.showWarningMessage(
      `Remove the declare module "*.css" and "*.scss" declarations in ${files}? TypeScript prefers them over the content mapper, so named imports stay untyped while they're there.`,
      { modal: true },
      'Remove',
    );
    if (choice === 'Remove') {
      for (const uri of project.wildcards) {
        const text = removeWildcardDeclarations((await read(uri)) ?? '');
        if (text === null) edit.deleteFile(uri);
        else await replace(uri, text);
      }
    } else {
      kept = true;
    }
  }

  if (!(await vscode.workspace.applyEdit(edit))) {
    void vscode.window.showErrorMessage(`pre.style: couldn't set up ${name}.`);
    return undefined;
  }
  for (const uri of changed) await (await vscode.workspace.openTextDocument(uri)).save();
  return (
    `Set up the content mapper in ${name}. tsc needs the --runExternalCode flag to run it, and VS Code needs the workspace to be trusted.` +
    (kept ? ' The wildcard declarations were kept, so named imports stay untyped.' : '')
  );
}

async function setUpCommand(only?: Project[]) {
  const pending = (only ?? (await findProjects())).filter((p) => !isDone(p));
  if (!pending.length) {
    void vscode.window.showInformationMessage(
      'pre.style: every TypeScript project that uses pre.style is already set up.',
    );
    return;
  }
  let picked = pending;
  if (pending.length > 1) {
    const items = await vscode.window.showQuickPick(
      pending.map((project) => ({
        label: vscode.workspace.asRelativePath(project.tsconfig),
        description: supportsContentMappers(project.typescript)
          ? `TypeScript ${project.typescript}: add the content mapper`
          : `TypeScript ${project.typescript}: add the stylesheet declaration`,
        picked: true,
        project,
      })),
      { canPickMany: true, title: 'Set up pre.style types' },
    );
    if (!items) return;
    picked = items.map((i) => i.project);
  }
  for (const project of picked) {
    const message = await setUp(project);
    if (message) void vscode.window.showInformationMessage(`pre.style: ${message}`);
  }
}

export function registerSetUp(context: vscode.ExtensionContext) {
  let prompted = false;
  const checked = new Set<string>();

  // Offered once per session, when a file that imports a stylesheet opens in a
  // project that isn't set up.
  async function maybePrompt(doc: vscode.TextDocument) {
    if (prompted || context.workspaceState.get(DISMISSED) || doc.uri.scheme !== 'file') return;
    if (!STYLESHEET_IMPORT.test(doc.getText())) return;
    const tsconfig = await nearest(vscode.Uri.joinPath(doc.uri, '..'), 'tsconfig.json');
    if (!tsconfig || checked.has(tsconfig.uri.toString())) return;
    checked.add(tsconfig.uri.toString());
    const project = await loadProject(tsconfig.uri);
    if (!project || isDone(project) || prompted) return;
    prompted = true;
    const choice = await vscode.window.showInformationMessage(
      `pre.style: set up types for stylesheet imports in ${vscode.workspace.asRelativePath(project.tsconfig)}?`,
      'Set Up',
      "Don't Ask Again",
    );
    if (choice === 'Set Up') await setUpCommand([project]);
    else if (choice === "Don't Ask Again") await context.workspaceState.update(DISMISSED, true);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(SET_UP_COMMAND, () => setUpCommand()),
    vscode.workspace.onDidOpenTextDocument(maybePrompt),
  );
  for (const doc of vscode.workspace.textDocuments) void maybePrompt(doc);
}
