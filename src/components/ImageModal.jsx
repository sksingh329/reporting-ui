import { useEffect } from 'react'

export default function ImageModal({ screenshots, index, onClose, onPrev, onNext }) {
  const sc = screenshots[index]
  const hasPrev = index > 0
  const hasNext = index < screenshots.length - 1

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowLeft') { if (hasPrev) onPrev() }
      else if (e.key === 'ArrowRight') { if (hasNext) onNext() }
      else if (e.key === 'Escape') { onClose() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [hasPrev, hasNext, onPrev, onNext, onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white text-3xl font-bold leading-none hover:text-gray-300 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {/* Prev arrow */}
      {hasPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold leading-none hover:text-gray-300 transition-colors select-none"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Previous screenshot"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <img
          src={sc.image_data ?? sc.download_url}
          alt={sc.step_name ?? 'screenshot'}
          className="max-h-[85vh] max-w-[85vw] rounded shadow-2xl object-contain"
        />
        {sc.step_name && (
          <span className="text-white/80 text-sm">{sc.step_name}</span>
        )}
        <span className="text-white/50 text-xs">{index + 1} / {screenshots.length}</span>
      </div>

      {/* Next arrow */}
      {hasNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold leading-none hover:text-gray-300 transition-colors select-none"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Next screenshot"
        >
          ›
        </button>
      )}
    </div>
  )
}
