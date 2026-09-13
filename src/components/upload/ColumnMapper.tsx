import { useState, useEffect } from 'react'

interface ColumnMapperProps {
  csvHeaders: string[]
  onMappingComplete: (mapping: Record<string, string>) => void
  onCancel: () => void
}

// Estes são os campos que o nosso banco de dados espera
const REQUIRED_DB_FIELDS = [
  { key: 'name', label: 'Nome do Cliente (Obrigatório)', required: true },
  { key: 'phone', label: 'Telefone (Obrigatório)', required: true },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'product', label: 'Produto', required: false },
]

export function ColumnMapper({ csvHeaders, onMappingComplete, onCancel }: ColumnMapperProps) {
  // mapping state: { dbKey: csvHeaderName }
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Auto-guess mapping based on common column names
  useEffect(() => {
    const initialMapping: Record<string, string> = {}
    
    csvHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase()
      if (!initialMapping['name'] && (lowerHeader.includes('nome') || lowerHeader.includes('name') || lowerHeader.includes('cliente'))) {
        initialMapping['name'] = header
      }
      if (!initialMapping['phone'] && (lowerHeader.includes('telefone') || lowerHeader.includes('celular') || lowerHeader.includes('whatsapp') || lowerHeader.includes('phone') || lowerHeader.includes('wpp'))) {
        initialMapping['phone'] = header
      }
      if (!initialMapping['email'] && (lowerHeader.includes('email') || lowerHeader.includes('e-mail'))) {
        initialMapping['email'] = header
      }
      if (!initialMapping['product'] && (lowerHeader.includes('produto') || lowerHeader.includes('oferta') || lowerHeader.includes('product'))) {
        initialMapping['product'] = header
      }
    })

    setMapping(initialMapping)
  }, [csvHeaders])

  const handleSelectChange = (dbKey: string, csvHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [dbKey]: csvHeader
    }))
  }

  const handleConfirm = () => {
    // Validate required fields
    for (const field of REQUIRED_DB_FIELDS) {
      if (field.required && !mapping[field.key]) {
        alert(`O campo "${field.label}" é obrigatório e precisa ser mapeado com alguma coluna do CSV.`)
        return
      }
    }
    onMappingComplete(mapping)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Mapear Colunas</h3>
        <p className="text-sm text-gray-500">
          Encontramos algumas colunas no seu arquivo. Ligue elas com os campos do sistema para importar corretamente.
        </p>
      </div>

      <div className="space-y-4">
        {REQUIRED_DB_FIELDS.map((dbField) => (
          <div key={dbField.key} className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 last:border-0">
            <div className="w-1/2 mb-2 sm:mb-0">
              <span className="text-sm font-medium text-gray-700">
                {dbField.label} {dbField.required && <span className="text-red-500">*</span>}
              </span>
            </div>
            <div className="w-full sm:w-1/2">
              <select 
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                value={mapping[dbField.key] || ''}
                onChange={(e) => handleSelectChange(dbField.key, e.target.value)}
              >
                <option value="">-- Ignorar (Não importar) --</option>
                {csvHeaders.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button 
          onClick={handleConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          Confirmar e Iniciar Upload
        </button>
      </div>
    </div>
  )
}
