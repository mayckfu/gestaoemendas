import { useState } from 'react'
import {
  Edit,
  Lock,
  Unlock,
  MoreHorizontal,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react'
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { User, Cargo } from '@/lib/mock-data'
import { UserFormDialog } from './UserFormDialog'
import { useToast } from '@/components/ui/use-toast'

interface UsersTableProps {
  users: User[]
  cargos: Cargo[]
  onUpdateUser: (user: User) => void
  onCreateUser: (user: Omit<User, 'id' | 'created_at'>) => void
  onDeleteUser?: (userId: string) => void
  onResetPassword: (email: string) => void
}

export const UsersTable = ({
  users,
  cargos,
  onUpdateUser,
  onCreateUser,
  onDeleteUser,
  onResetPassword,
}: UsersTableProps) => {
  const { toast } = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToBlock, setUserToBlock] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const getCargoName = (id?: string) => {
    return cargos.find((c) => c.id === id)?.nome || '-'
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  const handleToggleBlock = (user: User) => {
    if (user.status === 'BLOQUEADO') {
      // Unblock immediately
      onUpdateUser({ ...user, status: 'ATIVO' })
      toast({ title: 'Usuário desbloqueado com sucesso.' })
    } else {
      // Confirm block
      setUserToBlock(user)
      setBlockConfirmOpen(true)
    }
  }

  const confirmBlock = () => {
    if (userToBlock) {
      onUpdateUser({ ...userToBlock, status: 'BLOQUEADO' })
      toast({ title: 'Usuário bloqueado com sucesso.' })
    }
    setBlockConfirmOpen(false)
    setUserToBlock(null)
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (userToDelete && onDeleteUser) {
      onDeleteUser(userToDelete.id)
    }
    setDeleteConfirmOpen(false)
    setUserToDelete(null)
  }

  const handleResetPasswordClick = (user: User) => {
    onResetPassword(user.email)
  }

  const handleFormSubmit = (data: any) => {
    // Check for email uniqueness
    const emailExists = users.some(
      (u) =>
        u.email.toLowerCase() === data.email.toLowerCase() &&
        u.id !== editingUser?.id,
    )

    if (emailExists) {
      toast({
        title: 'Erro ao salvar',
        description: 'Este e-mail já está em uso por outro usuário.',
        variant: 'destructive',
      })
      return
    }

    const { password, confirmPassword, ...userData } = data

    if (editingUser) {
      const updatedUser = { ...editingUser, ...userData }
      if (password) {
        updatedUser.password = password
      }
      onUpdateUser(updatedUser)
    } else {
      onCreateUser({ ...userData, password })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.cpf || '-'}</TableCell>
                  <TableCell>{getCargoName(user.cargo_id)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.unidade || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.status === 'ATIVO'
                          ? 'bg-success hover:bg-success/80'
                          : user.status === 'BLOQUEADO'
                            ? 'bg-destructive hover:bg-destructive/80'
                            : 'bg-warning hover:bg-warning/80'
                      }
                    >
                      {user.status}
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
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleBlock(user)}
                        >
                          {user.status === 'BLOQUEADO' ? (
                            <>
                              <Unlock className="mr-2 h-4 w-4" /> Desbloquear
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" /> Bloquear
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResetPasswordClick(user)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Resetar Senha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
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

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editingUser}
        cargos={cargos}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso impedirá que o usuário <b>{userToBlock?.name}</b> acesse o
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlock}
              className="bg-destructive hover:bg-destructive/90"
            >
              Bloquear Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O usuário <b>{userToDelete?.name}</b>{' '}
              será removido permanentemente, juntamente com todos os registros
              de auditoria associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
