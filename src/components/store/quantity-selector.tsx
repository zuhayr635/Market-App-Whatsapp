"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuantitySelectorProps {
  value: number
  min?: number
  max: number
  onChange: (qty: number) => void
}

export function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (value > min) onChange(value - 1)
  }

  const handleIncrease = () => {
    if (value < max) onChange(value + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    if (!isNaN(val)) {
      onChange(Math.max(min, Math.min(max, val)))
    }
  }

  return (
    <div className="flex items-center gap-0">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrease}
        disabled={value <= min}
        className="h-9 w-9 rounded-r-none"
        aria-label="Azalt"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        className="h-9 w-12 border-y border-input bg-background text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrease}
        disabled={value >= max}
        className="h-9 w-9 rounded-l-none"
        aria-label="Artır"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
