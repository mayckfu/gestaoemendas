import * as React from 'react'
import { Input } from '@/components/ui/input'
import { formatCurrencyBRL, parseCurrencyBRL } from '@/lib/utils'

interface MoneyInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    // Initialize display value when value prop changes
    React.useEffect(() => {
      // Only update if the parsed display value is different from the prop value
      // to avoid cursor jumping or formatting issues during typing if we were strictly controlling it
      // However, for MoneyInput, it's usually better to control it on blur or strictly.
      // Here we format on initial load and updates from outside.
      if (value !== parseCurrencyBRL(displayValue)) {
        const formatted = formatCurrencyBRL(value)
        // Remove the R$ symbol for the input value to make it editable
        setDisplayValue(formatted.replace('R$', '').trim())
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      // Allow digits, comma, dot
      inputValue = inputValue.replace(/[^0-9,.]/g, '')

      setDisplayValue(inputValue)
      const parsed = parseCurrencyBRL(inputValue)
      onChange(parsed)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseCurrencyBRL(displayValue)
      const formatted = formatCurrencyBRL(parsed)
      setDisplayValue(formatted.replace('R$', '').trim())
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          {...props}
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`pl-9 ${className}`}
        />
      </div>
    )
  },
)
MoneyInput.displayName = 'MoneyInput'
