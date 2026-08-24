// Syntax-validate every source file and the generated preview bundle by running
// them through the TypeScript transpiler (JSX aware). transpileModule reports
// syntactic diagnostics only (no type-checking), which is exactly what we want.
import ts from '/opt/oai-docgen/node_modules/typescript/lib/typescript.js'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const opts = { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }

function check(name, code) {
  const out = ts.transpileModule(code, { compilerOptions: opts, reportDiagnostics: true })
  const errs = (out.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error)
  if (errs.length) {
    console.log(`\n✗ ${name}`)
    errs.slice(0, 6).forEach(d => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n')
      const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null
      console.log(`   ${pos ? `L${pos.line + 1}:${pos.character + 1} ` : ''}${msg}`)
    })
    return errs.length
  }
  return 0
}

function walk(dir) {
  return readdirSync(dir).flatMap(n => {
    const f = join(dir, n)
    return statSync(f).isDirectory() ? walk(f) : [f]
  })
}

let total = 0
for (const f of walk(join(ROOT, 'src')).filter(f => /\.(jsx?|js)$/.test(f))) {
  total += check(f.replace(ROOT, ''), readFileSync(f, 'utf8'))
}

// Extract and validate the in-browser bundle from preview.html.
const html = readFileSync(join(ROOT, 'preview.html'), 'utf8')
const m = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/)
if (m) total += check('preview.html (babel bundle)', m[1])

console.log(total === 0 ? '\n✓ All files and the preview bundle passed syntax validation.' : `\n✗ ${total} syntax error(s) found.`)
process.exit(total === 0 ? 0 : 1)
