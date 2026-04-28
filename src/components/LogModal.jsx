import { useState, useRef, useEffect } from 'react'
import ImageModal from './ImageModal'
import StatusBadge from './StatusBadge'

// ── Themes ─────────────────────────────────────────────────────────────────
const THEMES = [
  { id: 'terminal', label: 'Terminal', cls: 'bg-gray-900 text-green-400',                       swatch: '#111827' },
  { id: 'dracula',  label: 'Dracula',  cls: 'bg-[#282a36] text-[#f8f8f2]',                     swatch: '#282a36' },
  { id: 'light',    label: 'Light',    cls: 'bg-gray-50 text-gray-900 border border-gray-200', swatch: '#f9fafb' },
]

// ── Log toolbar (top / bottom) ──────────────────────────────────────────────
function LogToolbar({ position, onScrollToEnd, onScrollToTop, copied, onCopy }) {
  const isTop = position === 'top'
  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs text-gray-500 select-none ${
        isTop ? 'rounded-t-md' : 'rounded-b-md border-t-0'
      }`}
    >
      <button
        onClick={isTop ? onScrollToEnd : onScrollToTop}
        className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-200 hover:text-indigo-600 transition-colors"
      >
        <span className="font-bold">{isTop ? '↓' : '↑'}</span>
        {isTop ? 'Jump to End' : 'Jump to Top'}
      </button>
      <button
        onClick={onCopy}
        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
          copied ? 'text-green-600 font-medium' : 'hover:bg-gray-200 hover:text-indigo-600'
        }`}
      >
        {copied ? '✓ Copied!' : '⎘ Copy to clipboard'}
      </button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function LogModal({
  title,
  subtitle,
  status,
  log,
  errorMessage,
  screenshots = [],
  onClose,
}) {
  const [imgIndex, setImgIndex] = useState(null)
  const [theme, setTheme] = useState('terminal')
  const [copied, setCopied] = useState(false)

  // Auto-size height based on log length, capped at 85vh
  const sizeRef = useRef(null)
  const [size, setSize] = useState(() => {
    const lines = log ? log.split('\n').length : 0
    const h = Math.min(Math.max(340, 200 + lines * 17), Math.round(window.innerHeight * 0.85))
    const initial = { w: 800, h }
    sizeRef.current = initial
    return initial
  })

  const bodyRef = useRef(null)
  const currentTheme = THEMES.find(t => t.id === theme) ?? THEMES[0]

  // Escape closes modal (unless lightbox is open)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && imgIndex === null) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, imgIndex])

  // ── Drag-to-resize (bottom-right handle) ─────────────────────────────────
  const draggingRef = useRef(false)

  const onResizeMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    draggingRef.current = true
    const startX = e.clientX
    const startY = e.clientY
    const { w: startW, h: startH } = sizeRef.current

    const onMouseMove = (ev) => {
      const newSize = {
        w: Math.max(480, startW + (ev.clientX - startX)),
        h: Math.max(280, startH + (ev.clientY - startY)),
      }
      sizeRef.current = newSize
      setSize(newSize)
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      // Use setTimeout so the flag is cleared AFTER any click event fires
      setTimeout(() => { draggingRef.current = false }, 0)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const scrollToEnd = () => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }
  const scrollToTop = () => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }
  const copyLog = () => {
    if (!log) return
    navigator.clipboard.writeText(log)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {})
  }

  return (
    <>
      {imgIndex !== null && (
        <ImageModal
          screenshots={screenshots}
          index={imgIndex}
          onClose={() => setImgIndex(null)}
          onPrev={() => setImgIndex(i => Math.max(0, i - 1))}
          onNext={() => setImgIndex(i => Math.min(screenshots.length - 1, i + 1))}
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={() => { if (!draggingRef.current) onClose() }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl flex flex-col relative overflow-hidden"
          style={{
            width: size.w,
            height: size.h,
            maxWidth: '95vw',
            maxHeight: '92vh',
            minWidth: 480,
            minHeight: 280,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between px-5 py-3.5 border-b border-gray-100 bg-white shrink-0 gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
              <StatusBadge status={status ?? null} />

              {/* Theme picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 hidden sm:inline">Theme</span>
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      title={t.label}
                      aria-label={`Switch to ${t.label} theme`}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        theme === t.id
                          ? 'ring-2 ring-indigo-500 ring-offset-1 scale-125'
                          : 'hover:scale-110 opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        background: t.swatch,
                        border: t.id === 'light' ? '1px solid #d1d5db' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
            {errorMessage && (
              <div
                className={`rounded-md px-4 py-3 text-sm font-medium ${
                  status === 'failed'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                {errorMessage}
              </div>
            )}

            {log ? (
              <div>
                <LogToolbar
                  position="top"
                  onScrollToEnd={scrollToEnd}
                  onScrollToTop={scrollToTop}
                  copied={copied}
                  onCopy={copyLog}
                />
                <pre className={`text-xs p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed rounded-none ${currentTheme.cls}`}>
                  {log}
                </pre>
                <LogToolbar
                  position="bottom"
                  onScrollToEnd={scrollToEnd}
                  onScrollToTop={scrollToTop}
                  copied={copied}
                  onCopy={copyLog}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No log output for this execution.</p>
            )}

            {screenshots.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Screenshots ({screenshots.length})
                </p>
                <div className="flex flex-wrap gap-3 pb-2">
                  {screenshots.map((sc, i) => (
                    <button
                      key={sc.id ?? i}
                      onClick={() => setImgIndex(i)}
                      className="relative block rounded overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors cursor-pointer"
                      title={sc.step_name ?? `Screenshot ${i + 1}`}
                    >
                      <img
                        src={sc.image_data ?? sc.download_url}
                        alt={sc.step_name ?? `Screenshot ${i + 1}`}
                        className="h-28 w-auto object-cover"
                      />
                      {sc.step_name && (
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1.5 py-0.5 truncate">
                          {sc.step_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Resize handle (bottom-right corner) ─────────────────────── */}
          <div
            className="absolute bottom-0 right-0 w-7 h-7 cursor-se-resize z-10 flex items-end justify-end p-1"
            onMouseDown={onResizeMouseDown}
            title="Drag to resize"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-300">
              <circle cx="11" cy="11" r="1.5" fill="currentColor" />
              <circle cx="7"  cy="11" r="1.5" fill="currentColor" />
              <circle cx="11" cy="7"  r="1.5" fill="currentColor" />
              <circle cx="3"  cy="11" r="1.5" fill="currentColor" />
              <circle cx="7"  cy="7"  r="1.5" fill="currentColor" />
              <circle cx="11" cy="3"  r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
