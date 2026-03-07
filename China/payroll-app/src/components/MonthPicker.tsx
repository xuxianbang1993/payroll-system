import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
  value: string
  onChange: (month: string) => void
  disabled?: boolean
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function normalizeMonth(value: string): string {
  return MONTH_PATTERN.test(value) ? value : getCurrentMonth()
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthValue] = month.split("-").map(Number)
  const totalMonths = year * 12 + (monthValue - 1) + delta
  const nextYear = Math.floor(totalMonths / 12)
  const nextMonth = ((totalMonths % 12) + 12) % 12

  return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`
}

export function MonthPicker({ value, onChange, disabled = false }: MonthPickerProps) {
  const { t } = useTranslation()

  const currentMonth = getCurrentMonth()
  const normalizedMonth = normalizeMonth(value)
  const [year, monthValue] = normalizedMonth.split("-")
  const canGoNext = !disabled && normalizedMonth < currentMonth

  const handlePrevMonth = () => {
    if (disabled) {
      return
    }

    onChange(shiftMonth(normalizedMonth, -1))
  }

  const handleNextMonth = () => {
    if (!canGoNext) {
      return
    }

    const nextMonth = shiftMonth(normalizedMonth, 1)
    if (nextMonth <= currentMonth) {
      onChange(nextMonth)
    }
  }

  return (
    <div className={cn("flex items-center gap-2", disabled && "opacity-70")}>
      <span className="text-sm text-muted-foreground">{t("payroll.monthPicker.label")}</span>
      <div className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-border bg-card px-1 py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("payroll.monthPicker.prevMonth")}
          onClick={handlePrevMonth}
          disabled={disabled}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="min-w-[8rem] text-center text-sm font-medium text-foreground">
          {t("payroll.monthPicker.year", { year })}
          {t("payroll.monthPicker.month", { month: monthValue })}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("payroll.monthPicker.nextMonth")}
          onClick={handleNextMonth}
          disabled={!canGoNext}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
