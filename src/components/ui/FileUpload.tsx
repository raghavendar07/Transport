import { useRef, useState, type DragEvent } from 'react'
import { Upload, File as FileIcon, X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface FileUploadProps {
  value?: File | null
  onChange: (file: File | null) => void
  accept?: string
  /** Max size in bytes. Default 10 MB (compliance docs limit). */
  maxSize?: number
  id?: string
  'aria-describedby'?: string
}

const DEFAULT_MAX = 10 * 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function FileUpload({
  value,
  onChange,
  accept,
  maxSize = DEFAULT_MAX,
  id,
  ...aria
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function accept_(file: File | undefined) {
    if (!file) return
    if (file.size > maxSize) {
      setError(`File exceeds ${formatSize(maxSize)} limit.`)
      return
    }
    setError(null)
    onChange(file)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    accept_(e.dataTransfer.files[0])
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm text-text">
          <FileIcon className="h-4 w-4 text-text-subtle" aria-hidden />
          {value.name}
          <span className="text-text-subtle">({formatSize(value.size)})</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-text"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-brand hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          dragging && 'border-brand bg-brand-50',
        )}
        aria-describedby={aria['aria-describedby']}
      >
        <Upload className="h-6 w-6 text-text-subtle" aria-hidden />
        <span className="text-sm text-text">
          <span className="font-medium text-brand">Click to upload</span> or drag and drop
        </span>
        <span className="text-xs text-text-subtle">Up to {formatSize(maxSize)}</span>
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => accept_(e.target.files?.[0])}
      />
      {error && (
        <p className="mt-1.5 text-xs font-medium text-status-expired" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
