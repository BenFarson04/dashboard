// Catch undefined-identifier bugs (TS2304 "Cannot find name") in the preview
// bundle. Everything in the bundle shares one scope (via the __M registry), so a
// single-file program surfaces any component that uses a name it never imported.
import ts from '/opt/oai-docgen/node_modules/typescript/lib/typescript.js'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const html = readFileSync(join(ROOT, 'preview.html'), 'utf8')
const bundle = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/)[1]

const globals = `
declare const React:any, ReactDOM:any, window:any, document:any, localStorage:any,
  location:any, confirm:any, setTimeout:any, clearTimeout:any, console:any, Object:any,
  Date:any, Math:any, JSON:any, Array:any, __M:any, navigator:any, Error:any, Boolean:any, Number:any, String:any, Promise:any, parseInt:any, parseFloat:any;
`
const virtual = 'bundle.tsx'
const source = globals + '\n' + bundle
writeFileSync(join(ROOT, '.refcheck.tsx'), source)

const options = { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, allowJs: true, checkJs: true, noEmit: true, skipLibCheck: true, types: [] }
const host = ts.createCompilerHost(options)
const orig = host.getSourceFile.bind(host)
host.getSourceFile = (name, lang, ...r) =>
  name === virtual ? ts.createSourceFile(virtual, source, lang, true) : orig(name, lang, ...r)
host.fileExists = (f) => f === virtual || orig && false
host.readFile = (f) => f === virtual ? source : undefined

const program = ts.createProgram([virtual], options, host)
const diags = ts.getPreEmitDiagnostics(program).filter(d => d.code === 2304) // Cannot find name

const names = new Set()
for (const d of diags) {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n')
  const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null
  console.log(`L${pos ? pos.line + 1 : '?'}: ${msg}`)
  names.add(msg)
}
console.log(diags.length === 0 ? '✓ No undefined identifiers in the bundle.' : `✗ ${diags.length} undefined-identifier issue(s).`)
