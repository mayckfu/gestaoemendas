import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Search, Loader2, FileText, Hash } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useDebounce } from '@/hooks/use-debounce'
import { formatCurrencyBRL } from '@/lib/utils'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface SearchResult {
  id: string
  numero_emenda: string
  numero_proposta: string
  parlamentar: string
  autor: string
  valor_total: number
  objeto_emenda: string
  situacao: string
  status_interno: string
  portaria: string | null
}

export const GlobalSearch = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const navigate = useNavigate()
  const { isPrivacyMode } = usePrivacy()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        onOpenChange((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onOpenChange])

  const searchEmendas = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // Use the RPC function for format-agnostic search
      const { data, error } = await supabase
        .rpc('search_emendas_global', { search_term: searchTerm })
        .select(
          'id, numero_emenda, numero_proposta, parlamentar, autor, valor_total, objeto_emenda, situacao, status_interno, portaria',
        )

      if (error) throw error

      setResults(data as SearchResult[])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    searchEmendas(debouncedQuery)
  }, [debouncedQuery, searchEmendas])

  const handleSelect = (id: string) => {
    onOpenChange(false)
    navigate(`/emenda/${id}`)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar emendas, parlamentares, propostas, portarias..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : query.length > 0 && query.length < 2 ? (
            'Digite pelo menos 2 caracteres...'
          ) : (
            'Nenhum resultado encontrado.'
          )}
        </CommandEmpty>
        {!isLoading && results.length > 0 && (
          <CommandGroup heading="Resultados">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={`${result.parlamentar} ${result.numero_emenda} ${result.numero_proposta} ${result.portaria} ${result.objeto_emenda}`}
                onSelect={() => handleSelect(result.id)}
                className="flex items-center gap-3 p-3 cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">
                      {result.parlamentar}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {formatCurrencyBRL(result.valor_total, isPrivacyMode)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {result.numero_emenda}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">
                      Prop: {result.numero_proposta || 'N/A'}
                    </span>
                    {result.portaria && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Port. {result.portaria}
                        </span>
                      </>
                    )}
                  </div>
                  {result.objeto_emenda && (
                    <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                      {result.objeto_emenda}
                    </p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
