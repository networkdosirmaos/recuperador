import { Calendar } from 'lucide-react'

interface LeadManagementProps {
  status: string;
  scheduleDate: string;
  onStatusChange: (newStatus: string) => void;
  onScheduleChange: (newDate: string) => void;
}

export function LeadManagement({ status, scheduleDate, onStatusChange, onScheduleChange }: LeadManagementProps) {
  return (
    <div>
      <h3 className="text-[13px] font-bold text-gray-900 mb-2">Pós-Abordagem</h3>
      <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status do Lead</label>
          <select 
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 text-[13px] font-bold appearance-none transition-colors"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="novo">Novo</option>
            <option value="em_atendimento">Em andamento</option>
            <option value="recuperado">Recuperado (Ganho)</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Agendar Retorno</label>
          <div className="relative">
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => onScheduleChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 text-[13px] font-bold transition-colors"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
