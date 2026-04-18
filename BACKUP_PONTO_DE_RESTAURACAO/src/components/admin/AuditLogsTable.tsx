import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AuditLog } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'

interface AuditLogsTableProps {
  logs: AuditLog[]
}

export const AuditLogsTable = ({ logs }: AuditLogsTableProps) => {
  const [filterTable, setFilterTable] = useState('all')
  const [filterAction, setFilterAction] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs.filter((log) => {
    if (filterTable !== 'all' && log.table_name !== filterTable) return false
    if (filterAction !== 'all' && log.action !== filterAction) return false
    if (
      searchTerm &&
      !JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false
    return true
  })

  const sortedLogs = [...filteredLogs].sort(
    (a, b) =>
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
  )

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-500 hover:bg-green-600'
      case 'UPDATE':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'DELETE':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Buscar por detalhes ou usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/3"
        />
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="md:w-[200px]">
            <SelectValue placeholder="Tabela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Tabelas</SelectItem>
            <SelectItem value="profiles">Usuários</SelectItem>
            <SelectItem value="emendas">Emendas</SelectItem>
            <SelectItem value="repasses">Repasses</SelectItem>
            <SelectItem value="despesas">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="md:w-[200px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Ações</SelectItem>
            <SelectItem value="INSERT">Inserção</SelectItem>
            <SelectItem value="UPDATE">Atualização</SelectItem>
            <SelectItem value="DELETE">Exclusão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Registro ID</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss', {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>{log.changed_by}</TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.table_name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.record_id}
                  </TableCell>
                  <TableCell
                    className="max-w-[300px] truncate"
                    title={log.details || JSON.stringify(log)}
                  >
                    {log.details || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
