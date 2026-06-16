import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface FileUploadProps {
  onUpload?: (file: File) => void
  accept?: string
  maxSize?: number
  multiple?: boolean
  className?: string
  disabled?: boolean
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function FileUpload({
  onUpload,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 5 * 1024 * 1024,
  multiple = false,
  className,
  disabled,
}: FileUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string; progress: number }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList) => {
      setError(null)
      const newPreviews: { file: File; url: string; progress: number }[] = []

      Array.from(files).forEach((file) => {
        if (file.size > maxSize) {
          setError(`File "${file.name}" exceeds ${maxSize / 1024 / 1024}MB limit`)
          return
        }

        if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          const url = URL.createObjectURL(file)
          newPreviews.push({ file, url, progress: 0 })
          simulateProgress(newPreviews.length - 1)
        } else {
          newPreviews.push({ file, url: '', progress: 0 })
          simulateProgress(newPreviews.length - 1)
        }

        onUpload?.(file)
      })

      setPreviews((prev) => (multiple ? [...prev, ...newPreviews] : newPreviews))
    },
    [maxSize, multiple, onUpload]
  )

  const simulateProgress = (index: number) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
      }
      setPreviews((prev) =>
        prev.map((p, i) => (i === index ? { ...p, progress: Math.min(progress, 100) } : p))
      )
    }, 300)
  }

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      const file = prev[index]
      if (file.url) URL.revokeObjectURL(file.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 pointer-events-none'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supported formats: Images, PDF, DOC (max {maxSize / 1024 / 1024}MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {previews.length > 0 && (
        <div className="space-y-2">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {preview.url ? (
                <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-muted">
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{preview.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(preview.file.size / 1024).toFixed(1)} KB
                </p>
                {preview.progress < 100 && (
                  <Progress value={preview.progress} className="h-1 mt-1" />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
