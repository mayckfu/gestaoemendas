import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableTextProps {
  text: string | null | undefined
  className?: string
  limit?: number
}

export const ExpandableText = ({
  text,
  className,
  limit = 200,
}: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text) {
    return <span className="text-muted-foreground/50 italic">-</span>
  }

  const shouldTruncate = text.length > limit

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap break-words">
        {isExpanded || !shouldTruncate
          ? text
          : `${text.slice(0, limit).trim()}...`}
      </p>
      {shouldTruncate && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-primary font-semibold hover:no-underline hover:text-primary/80"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Ver mais
            </>
          )}
        </Button>
      )}
    </div>
  )
}
