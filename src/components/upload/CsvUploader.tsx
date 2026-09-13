import { useState, useRef } from 'react'
import { UploadCloud, FileType } from 'lucide-react'

interface CsvUploaderProps {
  onFileSelect: (file: File) => void
}

export function CsvUploader({ onFileSelect }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileSelect(file)
      } else {
        alert('Por favor, envie apenas arquivos CSV.')
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
        isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileInput}
      />
      <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-gray-200">
        <UploadCloud className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Clique ou arraste a planilha aqui</h3>
      <p className="text-sm text-gray-500 max-w-sm text-center">
        O arquivo deve estar no formato CSV. Recomendamos revisar os cabeçalhos antes de subir.
      </p>
      
      <div className="mt-6 flex items-center text-xs font-medium text-gray-400 bg-white px-3 py-1.5 rounded-md border border-gray-200">
        <FileType className="w-4 h-4 mr-2" />
        Suporta até ~100.000 linhas por vez
      </div>
    </div>
  )
}
