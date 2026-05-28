import { useState } from 'react'
import { Link } from 'react-router-dom'

// ── CodeBlock ─────────────────────────────────────────────────────────────────
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide uppercase">bash</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-colors
            text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
            hover:bg-white dark:hover:bg-gray-700"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-sm leading-relaxed px-5 py-4 overflow-x-auto whitespace-pre font-mono">
        {code}
      </pre>
    </div>
  )
}

// ── Placeholder legend ────────────────────────────────────────────────────────
const PLACEHOLDERS = [
  { name: 'YOUR_SERVER', description: 'Base URL of the reporting server, e.g. http://localhost:3000' },
  { name: 'PROJECT_ID', description: 'Numeric ID of the project — visible in the URL when browsing a project' },
  { name: 'SERVICE_TOKEN', description: 'Service token created in Profile → Service Tokens' },
  { name: 'test_status', description: 'One of: passed  |  failed  |  skipped' },
]

// ── Curl examples ─────────────────────────────────────────────────────────────
const EXAMPLE_LOG_ONLY = `curl -X POST "https://YOUR_SERVER/api/projects/PROJECT_ID/test-cases" \\
  -H "Authorization: Bearer SERVICE_TOKEN" \\
  -F "test_name=Login Test" \\
  -F "test_status=passed" \\
  -F "environment=staging" \\
  -F "duration_ms=1234" \\
  -F "log_text=Step 1: open login page ... PASSED
Step 2: enter credentials ... PASSED
Step 3: submit form ... PASSED"`

const EXAMPLE_WITH_SCREENSHOT = `curl -X POST "https://YOUR_SERVER/api/projects/PROJECT_ID/test-cases" \\
  -H "Authorization: Bearer SERVICE_TOKEN" \\
  -F "test_name=Checkout Flow" \\
  -F "test_status=failed" \\
  -F "environment=staging" \\
  -F "duration_ms=4521" \\
  -F "error_message=Button not found: #submit-btn" \\
  -F "log_text=Step 1: open cart page ... PASSED
Step 2: click checkout ... PASSED
Step 3: click submit button ... FAILED: element not found" \\
  -F "screenshots=@/path/to/failure-screenshot.png"`

// ── Field reference table ─────────────────────────────────────────────────────
const FIELDS = [
  { name: 'test_name', required: true, description: 'Unique name of the test case. If it already exists in the project, a new execution is added to it.' },
  { name: 'test_status', required: true, description: 'Result of the execution: passed, failed, or skipped.' },
  { name: 'environment', required: false, description: 'Environment label, e.g. staging, production, dev.' },
  { name: 'duration_ms', required: false, description: 'Execution time in milliseconds.' },
  { name: 'error_message', required: false, description: 'Short error or assertion message on failure.' },
  { name: 'log_text', required: false, description: 'Full execution log or output text.' },
  { name: 'screenshots', required: false, description: 'One or more image files attached as multipart fields (use -F "screenshots=@file.png" per file).' },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IntegrationPage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integration Guide</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Submit test results from your CI/CD pipeline or test framework using a simple HTTP call.
        </p>
      </div>

      {/* Prerequisites */}
      <section className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-6 py-5">
        <h2 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Before you start
        </h2>
        <ol className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1 list-decimal list-inside">
          <li>
            Create a{' '}
            <Link to="/profile" className="font-medium underline underline-offset-2 hover:text-indigo-900 dark:hover:text-indigo-100">
              Service Token
            </Link>
            {' '}in your Profile page — copy it immediately, it's shown only once.
          </li>
          <li>Note the numeric <strong>Project ID</strong> from the URL when viewing a project (e.g. <code className="bg-indigo-100 dark:bg-indigo-800/50 px-1 rounded">/projects/3/dashboard</code> → ID is <strong>3</strong>).</li>
          <li>All requests are <strong>multipart/form-data</strong> — use <code className="bg-indigo-100 dark:bg-indigo-800/50 px-1 rounded">-F</code> flags in curl (not <code className="bg-indigo-100 dark:bg-indigo-800/50 px-1 rounded">-d</code>).</li>
        </ol>
      </section>

      {/* Example 1 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Submit result with log text</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          The most common case — pass a test name, status, and the full execution log.
        </p>
        <CodeBlock code={EXAMPLE_LOG_ONLY} />
      </section>

      {/* Example 2 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Submit result with log text + screenshot</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Attach one or more screenshot files alongside the log. Multiple screenshots can be added by repeating the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs font-mono">-F "screenshots=@file"</code> flag.
        </p>
        <CodeBlock code={EXAMPLE_WITH_SCREENSHOT} />
      </section>

      {/* Field reference */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Form fields reference</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">Field</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Required</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {FIELDS.map((f) => (
                <tr key={f.name}>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{f.name}</td>
                  <td className="px-4 py-3">
                    {f.required ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        required
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        optional
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Placeholder legend */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Placeholder values</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44">Placeholder</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Replace with</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {PLACEHOLDERS.map((p) => (
                <tr key={p.name}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
