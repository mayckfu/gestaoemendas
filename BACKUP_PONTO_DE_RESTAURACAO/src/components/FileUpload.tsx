import { useState, useCallback } from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesAccepted: (files: File[]) => void
  className?: string
}

export const FileUpload = ({ onFilesAccepted, className }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragOver(true)
    },
    [],
  )

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragOver(true)
    },
    [],
  )

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragOver(false)
    },
    [],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(event.dataTransfer.files)
      if (files && files.length > 0) {
        onFilesAccepted(files)
      }
    },
    [onFilesAccepted],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files && files.length > 0) {
      onFilesAccepted(files)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out',
        isDragOver
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50',
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload-input')?.click()}
    >
      <input
        id="file-upload-input"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="text-center">
        <UploadCloud
          className={cn(
            'mx-auto h-10 w-10 mb-2 transition-colors',
            isDragOver ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Clique para enviar</span>{' '}
          ou arraste e solte
        </p>
        <p className="text-xs text-muted-foreground">
          Qualquer tipo de arquivo.
        </p>
      </div>
    </div>
  )
}
