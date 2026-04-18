import { useState } from 'react'
import { Edit, MoreHorizontal, Plus, Power } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Cargo } from '@/lib/mock-data'
import { RoleFormDialog } from './RoleFormDialog'
import { useToast } from '@/components/ui/use-toast'

interface RolesTableProps {
  cargos: Cargo[]
  onUpdateCargo: (cargo: Cargo) => void
  onCreateCargo: (cargo: Omit<Cargo, 'id'>) => void
}

export const RolesTable = ({
  cargos,
  onUpdateCargo,
  onCreateCargo,
}: RolesTableProps) => {
  const { toast } = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)

  const handleEdit = (cargo: Cargo) => {
    setEditingCargo(cargo)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingCargo(null)
    setIsFormOpen(true)
  }

  const handleToggleActive = (cargo: Cargo) => {
    onUpdateCargo({ ...cargo, active: !cargo.active })
    toast({
      title: `Cargo ${!cargo.active ? 'ativado' : 'desativado'} com sucesso.`,
    })
  }

  const handleFormSubmit = (data: any) => {
    if (editingCargo) {
      onUpdateCargo({ ...editingCargo, ...data })
      toast({ title: 'Cargo atualizado com sucesso.' })
    } else {
      onCreateCargo(data)
      toast({ title: 'Cargo criado com sucesso.' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cargo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Cargo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Perfil Padrão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Nenhum cargo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              cargos.map((cargo) => (
                <TableRow key={cargo.id}>
                  <TableCell className="font-medium">{cargo.nome}</TableCell>
                  <TableCell>{cargo.descricao || '-'}</TableCell>
                  <TableCell>
                    {cargo.default_role ? (
                      <Badge variant="outline">{cargo.default_role}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cargo.active ? 'default' : 'secondary'}>
                      {cargo.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(cargo)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(cargo)}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {cargo.active ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        cargo={editingCargo}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
