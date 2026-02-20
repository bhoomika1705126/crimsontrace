import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function Uploader({ onFile, disabled }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFile(acceptedFiles[0])
    }
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled
  })

  const file = acceptedFiles[0]

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-rose-500 bg-rose-500/5' 
            : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          <svg 
            className={`w-12 h-12 ${isDragActive ? 'text-rose-500' : 'text-slate-600'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <div className="space-y-1">
            <p className="text-sm font-rajdhani tracking-wider text-slate-300">
              {isDragActive 
                ? 'Drop the CSV file here' 
                : 'Drag & drop a CSV file here, or click to select'
              }
            </p>
            <p className="text-xs font-share text-slate-600">
              Only .csv files accepted (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {file && (
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-share text-slate-300 truncate">{file.name}</p>
            <p className="text-xs font-share text-slate-600">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <button
            onClick={() => onFile(null)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}