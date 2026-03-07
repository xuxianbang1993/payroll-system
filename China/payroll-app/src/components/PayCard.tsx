import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Employee, PayrollInput, PaySlip } from "@/types/payroll"
import { formatAmount } from "@/utils/format"

interface PayCardProps {
  employee: Employee
  input?: PayrollInput
  slip?: PaySlip
  onUpdateInput: (employeeId: number, input: PayrollInput) => Promise<boolean>
  onGenerateSlip: (employeeId: number) => Promise<boolean>
  generating?: boolean
}

interface ResultRowProps {
  label: string
  value: number
  emphasize?: boolean
}

type NumericInputField = Exclude<keyof PayrollInput, "perfGrade">

const PERF_GRADE_UNSET = "__unset__"

function ResultRow({ label, value, emphasize = false }: ResultRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", emphasize && "font-semibold")}>{formatAmount(value)}</span>
    </div>
  )
}

export function PayCard({
  employee,
  input,
  slip,
  onUpdateInput,
  onGenerateSlip,
  generating = false,
}: PayCardProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [localInput, setLocalInput] = useState<PayrollInput>(input ?? {})

  useEffect(() => {
    setLocalInput(input ?? {})
  }, [input])

  const handlePerfGradeChange = (value: string) => {
    setLocalInput((prev) => ({
      ...prev,
      perfGrade: value === PERF_GRADE_UNSET ? "" : value,
    }))
  }

  const handleNumericChange = (field: NumericInputField) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    const parsedValue = raw === "" ? undefined : (parseFloat(raw) || 0)
    setLocalInput((prev) => ({
      ...prev,
      [field]: parsedValue,
    }))
  }

  const handleSaveInput = async () => {
    await onUpdateInput(employee.id, localInput)
  }

  const handleGenerateSlip = async () => {
    await onGenerateSlip(employee.id)
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-1 text-left"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-foreground">{employee.name}</span>
                  <Badge variant={slip ? "default" : "secondary"}>
                    {slip ? t("payroll.card.statusGenerated") : t("payroll.card.statusNotGenerated")}
                  </Badge>
                  {slip ? (
                    <span className="text-sm font-semibold text-primary">{formatAmount(slip.netPay)}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{employee.position}</span>
                  <span>{employee.company}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("payroll.card.baseSalary")}</span>
                  <span className="ml-1 font-medium text-foreground">{formatAmount(employee.baseSalary)}</span>
                </div>
              </div>
              <div className="shrink-0 text-muted-foreground">
                {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 border-t pt-4">
            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`perf-grade-${employee.id}`}>{t("payroll.card.input.perfGrade")}</Label>
                  <Select
                    value={localInput.perfGrade && localInput.perfGrade.length > 0 ? localInput.perfGrade : PERF_GRADE_UNSET}
                    onValueChange={handlePerfGradeChange}
                    disabled={generating}
                  >
                    <SelectTrigger id={`perf-grade-${employee.id}`} className="w-full">
                      <SelectValue placeholder={t("payroll.card.input.perfGradePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PERF_GRADE_UNSET}>{t("payroll.card.input.perfGradeUnset")}</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor={`perf-salary-${employee.id}`}>{t("payroll.card.input.perfSalary")}</Label>
                  <Input
                    id={`perf-salary-${employee.id}`}
                    type="number"
                    value={localInput.perfSalary ?? ""}
                    onChange={handleNumericChange("perfSalary")}
                    disabled={generating}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor={`commission-${employee.id}`}>{t("payroll.card.input.commission")}</Label>
                  <Input
                    id={`commission-${employee.id}`}
                    type="number"
                    value={localInput.commission ?? ""}
                    onChange={handleNumericChange("commission")}
                    disabled={generating}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor={`bonus-${employee.id}`}>{t("payroll.card.input.bonus")}</Label>
                  <Input
                    id={`bonus-${employee.id}`}
                    type="number"
                    value={localInput.bonus ?? ""}
                    onChange={handleNumericChange("bonus")}
                    disabled={generating}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor={`absent-hours-${employee.id}`}>{t("payroll.card.input.absentHours")}</Label>
                  <Input
                    id={`absent-hours-${employee.id}`}
                    type="number"
                    value={localInput.absentHours ?? ""}
                    onChange={handleNumericChange("absentHours")}
                    disabled={generating}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor={`tax-${employee.id}`}>{t("payroll.card.input.tax")}</Label>
                  <Input
                    id={`tax-${employee.id}`}
                    type="number"
                    value={localInput.tax ?? ""}
                    onChange={handleNumericChange("tax")}
                    disabled={generating}
                  />
                </div>

                <div className="grid gap-1.5 col-span-2">
                  <Label htmlFor={`other-adjustment-${employee.id}`}>{t("payroll.card.input.otherAdj")}</Label>
                  <Input
                    id={`other-adjustment-${employee.id}`}
                    type="number"
                    value={localInput.otherAdj ?? ""}
                    onChange={handleNumericChange("otherAdj")}
                    disabled={generating}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void handleSaveInput()} disabled={generating}>
                  {t("payroll.card.saveInput")}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleGenerateSlip()}
                  disabled={generating}
                  aria-busy={generating}
                >
                  {generating ? <Loader2 className="size-4 animate-spin" /> : null}
                  {t("payroll.card.generateSlip")}
                </Button>
              </div>
            </section>

            {slip ? (
              <section className="space-y-5 border-t pt-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{t("payroll.card.result.income")}</h4>
                  <ResultRow label={t("payroll.card.result.base")} value={slip.base} />
                  <ResultRow label={t("payroll.card.result.perfSalary")} value={slip.perfSalary} />
                  <ResultRow label={t("payroll.card.result.commission")} value={slip.commission} />
                  <ResultRow label={t("payroll.card.result.bonus")} value={slip.bonus} />
                  <ResultRow label={t("payroll.card.result.absentDeduct")} value={slip.absentDeduct} />
                  <ResultRow label={t("payroll.card.result.otherAdj")} value={slip.otherAdj} />
                  <ResultRow label={t("payroll.card.result.grossPay")} value={slip.grossPay} emphasize />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{t("payroll.card.result.company")}</h4>
                  <ResultRow label={t("payroll.card.result.cSocial")} value={slip.cSocial} />
                  <ResultRow label={t("payroll.card.result.cFund")} value={slip.cFund} />
                  <ResultRow label={t("payroll.card.result.cTotal")} value={slip.cTotal} emphasize />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">{t("payroll.card.result.personal")}</h4>
                  <ResultRow label={t("payroll.card.result.wPension")} value={slip.wPension} />
                  <ResultRow label={t("payroll.card.result.wUnemploy")} value={slip.wUnemploy} />
                  <ResultRow label={t("payroll.card.result.wMedical")} value={slip.wMedical} />
                  <ResultRow label={t("payroll.card.result.wSocial")} value={slip.wSocial} />
                  <ResultRow label={t("payroll.card.result.wFund")} value={slip.wFund} />
                  <ResultRow label={t("payroll.card.result.tax")} value={slip.tax} />
                  <ResultRow label={t("payroll.card.result.totalDeduct")} value={slip.totalDeduct} emphasize />
                </div>

                <div className="rounded-[var(--radius-sm)] border border-border bg-accent/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{t("payroll.card.result.netPay")}</span>
                    <span className="text-xl font-semibold text-primary">{formatAmount(slip.netPay)}</span>
                  </div>
                </div>
              </section>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
