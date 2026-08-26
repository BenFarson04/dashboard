import ts from '/opt/oai-docgen/node_modules/typescript/lib/typescript.js'
// -----------------------------------------------------------------------------
// build-preview.mjs
// Compiles the modular src/ tree into a single self-contained preview.html that
// runs in any modern browser (React + Tailwind via CDN, JSX transpiled in-browser
// by Babel). This is ONLY for a zero-install preview — the real app runs via Vite.
//
// It is a tiny text-level bundler: it wraps each ES module in an IIFE, stores its
// exports in a registry (__M), and rewrites imports to read from that registry.
// -----------------------------------------------------------------------------
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, posix } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

// ---- collect source files ---------------------------------------------------
function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return [full]
  })
}
const files = walk(SRC).filter(f => /\.(jsx?|js)$/.test(f) && !f.endsWith('main.jsx'))

// module id: path relative to src, no extension, index -> directory
function idOf(file) {
  let id = posix.normalize(relative(SRC, file).split('\\').join('/')).replace(/\.(jsx?|js)$/, '')
  if (id.endsWith('/index')) id = id.slice(0, -'/index'.length)
  if (id === 'index') id = ''
  return id
}

// Preview-only Icon implementation (uses the lucide vanilla UMD global).
const PREVIEW_ICON = `
function Icon({ name, size = 18, className = '', ...rest }) {
  let data = (typeof window !== 'undefined' && window.lucide && window.lucide.icons) ? window.lucide.icons[name] : null
  if (data && !Array.isArray(data) && Array.isArray(data.default)) data = data.default
  const children = Array.isArray(data)
    ? data.map((node, i) => React.createElement(node[0], Object.assign({ key: i }, node[1])))
    : null
  return React.createElement('svg', Object.assign({
    xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    className, 'aria-hidden': 'true',
  }, rest), children)
}
`

const modules = files.map(file => {
  const id = idOf(file)
  // directory of the file relative to src — used to resolve relative imports.
  const dir = posix.dirname(relative(SRC, file).split('\\').join('/'))
  const isIcon = id === 'components/ui/Icon'
  let raw = isIcon ? `export ${PREVIEW_ICON.trim()}` : readFileSync(file, 'utf8')
  raw = raw.replaceAll('import.meta.env.BASE_URL', "''")
  // Collapse multiline named imports (`import {\n a,\n b\n} from '...'`) onto one line
  // so the line-based transform below can handle them.
  raw = raw.replace(/import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]/g, m => m.replace(/\s*\n\s*/g, ' '))
  return { file, id, dir, raw }
})

// resolve a relative import specifier against the importer's directory
function resolve(fromDir, spec) {
  let r = posix.normalize(posix.join(fromDir === '.' ? '' : fromDir, spec))
  if (r.startsWith('./')) r = r.slice(2)
  return r
}

// parse a single-line import into JS that reads from the registry / React global
function transformImport(line, fromDir, deps) {
  const m = line.match(/^import\s+(.*?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/)
  if (!m) {
    // side-effect import (e.g. css) — drop it
    if (/^import\s+['"]/.test(line.trim())) return ''
    return line
  }
  let [, clause, spec] = m
  // package imports
  if (spec === 'react') {
    const named = clause.replace(/^[^{]*\{?/, '').replace(/\}.*$/, '')
    const names = named.split(',').map(s => s.trim()).filter(Boolean)
    return names.length ? `const { ${names.join(', ')} } = React;` : ''
  }
  if (spec === 'lucide-react' || spec === 'react-dom' || spec === 'react-dom/client') return ''

  const id = resolve(fromDir, spec)
  deps.add(id)
  const ref = `__M[${JSON.stringify(id)}]`

  // import * as ns
  let ns = clause.match(/^\*\s+as\s+(\w+)$/)
  if (ns) return `const ${ns[1]} = ${ref};`

  // default and/or named
  let def = null, named = []
  const braceMatch = clause.match(/\{([^}]*)\}/)
  if (braceMatch) {
    named = braceMatch[1].split(',').map(s => s.trim()).filter(Boolean).map(s => {
      const as = s.match(/^(\w+)\s+as\s+(\w+)$/)
      return as ? `${as[1]}: ${as[2]}` : s
    })
  }
  const defMatch = clause.replace(/\{[^}]*\}/, '').replace(',', '').trim()
  if (defMatch) def = defMatch

  const out = []
  if (def) out.push(`const ${def} = ${ref}.default;`)
  if (named.length) out.push(`const { ${named.join(', ')} } = ${ref};`)
  return out.join(' ')
}

// transform a module body: rewrite imports, strip exports, collect export names
function transformModule(mod) {
  const deps = new Set()
  const exportNames = new Set()
  let defaultName = null

  const lines = mod.raw.split('\n').map(line => {
    if (/^\s*import\b/.test(line) && /\bfrom\b|import\s+['"]/.test(line)) {
      return transformImport(line.trim(), mod.dir, deps)
    }
    // export { a, b as c }  (re-export list without declaration)
    const listMatch = line.match(/^\s*export\s*\{([^}]*)\}\s*;?\s*$/)
    if (listMatch) {
      listMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
        const as = s.match(/^(\w+)\s+as\s+(\w+)$/)
        exportNames.add(as ? as[2] : s)
      })
      return '' // names already declared in scope
    }
    // export default function App(
    let m = line.match(/^\s*export\s+default\s+function\s+(\w+)/)
    if (m) { defaultName = m[1]; return line.replace(/^\s*export\s+default\s+/, '') }
    // export default <expr>
    m = line.match(/^\s*export\s+default\s+/)
    if (m) { defaultName = '__default'; return line.replace(/^\s*export\s+default\s+/, 'const __default = ') }
    // export (async) function NAME
    m = line.match(/^\s*export\s+(async\s+)?function\s+(\w+)/)
    if (m) { exportNames.add(m[2]); return line.replace(/^\s*export\s+/, '') }
    // export const/let NAME
    m = line.match(/^\s*export\s+(const|let)\s+(\w+)/)
    if (m) { exportNames.add(m[2]); return line.replace(/^\s*export\s+/, '') }
    return line
  })

  const returnPairs = [...exportNames].map(n => n)
  if (defaultName) returnPairs.push(`default: ${defaultName}`)
  const body = lines.join('\n')
  const code = `__M[${JSON.stringify(mod.id)}] = (function(){\n${body}\nreturn { ${returnPairs.join(', ')} };\n})();`
  return { ...mod, deps: [...deps], code }
}

const transformed = modules.map(transformModule)
const byId = Object.fromEntries(transformed.map(m => [m.id, m]))

// topological sort so a module's dependencies are emitted before it
const order = []
const seen = new Set()
function visit(id, stack = new Set()) {
  if (seen.has(id) || !byId[id]) return
  stack.add(id)
  byId[id].deps.forEach(d => { if (byId[d] && !stack.has(d)) visit(d, stack) })
  stack.delete(id)
  if (!seen.has(id)) { seen.add(id); order.push(id) }
}
transformed.forEach(m => visit(m.id))

const bundle = order.map(id => byId[id].code).join('\n\n')

const jsxScript = `
const __M = {};
${bundle}

const App = __M['App'].default;
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
`

// Pre-compile the JSX to plain JavaScript at build time using the TypeScript
// compiler. This removes the in-browser Babel dependency entirely, so the preview
// loads instantly and reliably (only React/ReactDOM/lucide/Tailwind CDNs remain).
const compiled = ts.transpileModule(jsxScript, {
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.ES2019, // widest browser support (down-levels ?. etc.)
    module: ts.ModuleKind.None,
  },
}).outputText

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Command Centre — Personal Dashboard (Preview)</title>
  <!--
    ZERO-INSTALL PREVIEW BUILD (mock data).
    Auto-generated from src/ by scripts/build-preview.mjs — do not edit by hand.
    JSX is PRE-COMPILED to plain JS, so no in-browser transpiler is needed.
    Needs an internet connection for React, lucide and Tailwind (loaded from CDNs).
    For real development use the Vite project:  npm install && npm run dev
  -->
  <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js" crossorigin></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' }</script>
  <style>
    * { scrollbar-width: thin; }
    *::-webkit-scrollbar { width: 8px; height: 8px; }
    *::-webkit-scrollbar-thumb { background: rgb(148 163 184 / .35); border-radius: 9999px; }
    #status { position: fixed; inset: 0; display: grid; place-items: center; padding: 24px;
              font: 500 14px system-ui, sans-serif; color: #475569; text-align: center; }
    #status .box { max-width: 640px; }
    #status pre { margin-top: 12px; text-align: left; white-space: pre-wrap; font-size: 12px;
                  color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca;
                  border-radius: 10px; padding: 12px; overflow: auto; max-height: 40vh; }
  </style>
</head>
<body class="bg-slate-50">
  <div id="root"></div>
  <div id="status"><div class="box">Loading preview…<br/><span style="font-size:12px;color:#94a3b8">If this message stays, you are probably offline — the preview needs internet to load React &amp; Tailwind from a CDN.</span></div></div>

  <script>
    // Never fail silently: surface any load/runtime error on screen.
    function showError(title, detail) {
      var s = document.getElementById('status');
      if (!s) return;
      s.innerHTML = '<div class="box"><strong>' + title + '</strong>' +
        '<pre>' + (detail || '') + '</pre>' +
        '<div style="margin-top:10px;font-size:12px;color:#64748b">' +
        'Tip: check your internet connection, or run the full app with <code>npm install</code> then <code>npm run dev</code>.</div></div>';
    }
    window.addEventListener('error', function (e) {
      showError('The preview hit an error', (e && e.message ? e.message : '') + (e && e.filename ? '\\n' + e.filename + ':' + e.lineno : ''));
    });
    // If the CDNs did not load, say so clearly.
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (!window.React || !window.ReactDOM) {
          showError('Could not load React from the CDN', 'You appear to be offline or a network policy is blocking unpkg.com.\\nUse the Vite project instead: npm install && npm run dev');
        }
      }, 1500);
    });
  </script>

  <script>
    try {
      if (window.React && window.ReactDOM) {
        var s = document.getElementById('status'); if (s) s.remove();
${compiled}
      }
    } catch (err) {
      showError('The preview failed to start', (err && err.stack) ? err.stack : String(err));
    }
  </script>
</body>
</html>
`

writeFileSync(join(ROOT, 'preview.html'), html)
console.log(`preview.html written — ${order.length} modules, ${(html.length / 1024).toFixed(0)} KB (Babel-free, JSX pre-compiled)`)
