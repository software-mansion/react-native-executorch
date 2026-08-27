/**
 * The `'worklet'` directive convention.
 *
 * `.agents/skills/core-guidelines/SKILL.md` states it plainly: every
 * TypeScript function that wraps a native JSI call has to start with
 * `'worklet';`, so the function can be serialized onto a worklet runtime.
 *
 * Nothing enforces it. A missing directive is invisible on the JS thread — the
 * function works exactly as before — and only fails once someone calls the
 * pipeline from a worklet (a camera frame processor, an audio callback), with
 * an error that points at the call site rather than at the omission.
 *
 * So the convention is checked the only way it can be: by reading the source.
 * The reading is done with the TypeScript parser rather than regular
 * expressions — an object type in a parameter list (`opts: { mode: string }`)
 * defeats brace counting, and overload declarations have no body at all.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import ts from 'typescript';

const SRC = join(__dirname, '..', '..', 'src');

/**
 * Every `.ts` file under `src/`, relative to it.
 */
function sourceFiles(directory = SRC, prefix = ''): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry);
    const relative = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(full).isDirectory()) return sourceFiles(full, relative);
    return entry.endsWith('.ts') ? [relative] : [];
  });
}

type FunctionInfo = {
  file: string;
  name: string;
  label: string;
  hasDirective: boolean;
  callsJsi: boolean;
  isAsync: boolean;
};

/**
 * Whether a function body opens with the `'worklet'` directive prologue.
 */
function hasWorkletDirective(body: ts.Block): boolean {
  const first = body.statements[0];
  return (
    !!first &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === 'worklet'
  );
}

/**
 * Whether a body calls a method on the JSI global (a property read is not a call).
 */
function callsJsiFunction(body: ts.Node): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isCallExpression(node) && /(^|\.)rnexecutorchJsi\./.test(node.expression.getText())) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(body, visit);
  return found;
}

/**
 * Every exported top-level function in a file, with what the check needs to know.
 */
function exportedFunctions(file: string): FunctionInfo[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(SRC, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );

  const results: FunctionInfo[] = [];

  for (const statement of source.statements) {
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    if (!modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;

    /**
     * Records one function-like node under `name`.
     */
    const record = (name: string, node: ts.FunctionLikeDeclaration) => {
      const body = node.body;
      if (!body || !ts.isBlock(body)) return; // an overload signature has none
      results.push({
        file,
        name,
        label: `${file} → ${name}()`,
        hasDirective: hasWorkletDirective(body),
        callsJsi: callsJsiFunction(body),
        isAsync: !!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword),
      });
    };

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      record(statement.name.text, statement);
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer;
        if (!initializer || !ts.isIdentifier(declaration.name)) continue;
        if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
          record(declaration.name.text, initializer);
        }
      }
    }
  }

  return results;
}

const files = sourceFiles();
const allFunctions = files.flatMap(exportedFunctions);

/** Exported functions that call into the JSI global from their own body. */
const jsiWrappers = allFunctions.filter(({ callsJsi }) => callsJsi);

describe('worklet directive', () => {
  it('finds the JSI wrappers to check', () => {
    // A refactor that moved every JSI call behind a new indirection would
    // otherwise make this suite pass by checking nothing.
    expect(jsiWrappers.length).toBeGreaterThan(10);
  });

  it.each(jsiWrappers.filter(({ isAsync }) => !isAsync))(
    '$label starts with the worklet directive',
    ({ hasDirective }) => {
      expect(hasDirective).toBe(true);
    }
  );

  it('never marks an async function as a worklet', () => {
    // A worklet runs synchronously on its runtime; an `async` one would be
    // serialized but could never be awaited there.
    const offenders = allFunctions
      .filter(({ isAsync, hasDirective }) => isAsync && hasDirective)
      .map(({ label }) => label);

    expect(offenders).toEqual([]);
  });

  it('marks every exported function in the extension op modules', () => {
    // `src/extensions/**/ops/` and `math.ts` are the thin native wrappers; each
    // of their exports is meant to be worklet-callable.
    const opModules = allFunctions.filter(
      ({ file }) => /extensions\/[^/]+\/ops\/\w+\.ts$/.test(file) || file === 'extensions/math.ts'
    );
    expect(opModules.length).toBeGreaterThan(0);

    const missing = opModules
      .filter(({ hasDirective, isAsync }) => !hasDirective && !isAsync)
      .map(({ label }) => label);

    expect(missing).toEqual([]);
  });
});

describe('architecture boundaries', () => {
  it('imports the JSI global only through src/native/bridge.ts', () => {
    const offenders = files
      .filter((file) => file !== 'native/bridge.ts')
      .filter((file) => readFileSync(join(SRC, file), 'utf8').includes('__rnexecutorch_jsi__'));

    expect(offenders).toEqual([]);
  });

  it('keeps core/ free of domain-specific extension imports', () => {
    // The core/extensions split from the architecture guide: core is
    // domain-agnostic, so it must never reach sideways into `extensions/`.
    const offenders = files
      .filter((file) => file.startsWith('core/'))
      .filter((file) => /from '.*extensions\//.test(readFileSync(join(SRC, file), 'utf8')));

    expect(offenders).toEqual([]);
  });

  it('keeps hooks/ out of the native layer, so they compose task pipelines only', () => {
    const offenders = files
      .filter((file) => file.startsWith('hooks/'))
      .filter((file) => /from '.*native\//.test(readFileSync(join(SRC, file), 'utf8')));

    expect(offenders).toEqual([]);
  });
});
