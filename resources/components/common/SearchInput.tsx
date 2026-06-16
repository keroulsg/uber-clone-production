import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  onDebounce?: (value: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

export function SearchInput({
  value: externalValue,
  onChange,
  onDebounce,
  placeholder = 'Search...',
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const value = externalValue ?? internalValue
  const setValue = onChange ?? setInternalValue

  useEffect(() => {
    if (externalValue !== undefined) setInternalValue(externalValue)
  }, [externalValue])

  useEffect(() => {
    if (!onDebounce) return
    debounceRef.current = setTimeout(() => onDebounce(value), debounceMs)
    return () => clearTimeout(debounceRef.current)
  }, [value, debounceMs, onDebounce])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 h-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => setValue('')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
