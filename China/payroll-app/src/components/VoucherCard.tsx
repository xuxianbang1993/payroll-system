import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Voucher } from "@/types/voucher";
import { formatAmount } from "@/utils/format";

interface VoucherCardProps {
  voucher: Voucher;
}

export function VoucherCard({ voucher }: VoucherCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-base">{voucher.title}</CardTitle>
        <Badge variant={voucher.balanced ? "default" : "destructive"}>
          <span aria-hidden="true">{voucher.balanced ? "✅" : "⚠️"}</span>
          <span>{voucher.balanced ? t("voucher.balanced") : t("voucher.unbalanced")}</span>
        </Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科目</TableHead>
              <TableHead className="text-right">{t("voucher.debit")}</TableHead>
              <TableHead className="text-right">{t("voucher.credit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voucher.entries.map((entry, index) => (
              <TableRow key={`${entry.direction}-${entry.account}-${index}`}>
                <TableCell>{entry.account}</TableCell>
                <TableCell className="text-right font-mono">
                  {entry.direction === "debit" ? formatAmount(entry.amount) : ""}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {entry.direction === "credit" ? formatAmount(entry.amount) : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">{t("voucher.total")}</TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {formatAmount(voucher.debitTotal)}
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {formatAmount(voucher.creditTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
