import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BirthDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 28;

  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    if (value) return new Date(value.getFullYear(), value.getMonth(), 1);
    return new Date(defaultYear, 0, 1);
  });

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) setOpen(false);
  };

  const handleMonthChange = (monthStr: string) => {
    const m = parseInt(monthStr, 10);
    setDisplayMonth(new Date(displayMonth.getFullYear(), m, 1));
  };

  const handleYearChange = (yearStr: string) => {
    const y = parseInt(yearStr, 10);
    setDisplayMonth(new Date(y, displayMonth.getMonth(), 1));
  };

  const years: number[] = [];
  for (let y = currentYear; y >= 1900; y--) {
    years.push(y);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          aria-label="Selecione sua data de nascimento"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : "DD/MM/AAAA"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <div className="p-3 space-y-3">
          {/* Month/Year dropdowns */}
          <div className="flex gap-2">
            <Select value={String(displayMonth.getMonth())} onValueChange={handleMonthChange}>
              <SelectTrigger className="flex-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {MONTHS_PT.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(displayMonth.getFullYear())} onValueChange={handleYearChange}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            locale={ptBR}
            className="p-0 pointer-events-auto"
            classNames={{
              caption: "hidden",
              nav: "hidden",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
