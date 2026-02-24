import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, setMonth, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";

type Step = "year" | "month" | "day";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface BirthDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

export function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("year");

  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 28;

  const [selectedYear, setSelectedYear] = useState<number>(value?.getFullYear() ?? defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(value?.getMonth() ?? 0);
  const [yearPageStart, setYearPageStart] = useState(() => {
    const baseYear = value?.getFullYear() ?? defaultYear;
    return baseYear - (baseYear % 20);
  });

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = yearPageStart; y < yearPageStart + 20 && y <= currentYear; y++) {
      if (y >= 1920) list.push(y);
    }
    return list;
  }, [yearPageStart, currentYear]);

  const calendarMonth = useMemo(() => {
    let d = new Date();
    d = setYear(d, selectedYear);
    d = setMonth(d, selectedMonth);
    return d;
  }, [selectedYear, selectedMonth]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setStep("year");
      const baseYear = value?.getFullYear() ?? defaultYear;
      setSelectedYear(baseYear);
      setSelectedMonth(value?.getMonth() ?? 0);
      setYearPageStart(baseYear - (baseYear % 20));
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setStep("month");
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setStep("day");
  };

  const handleDaySelect = (date: Date | undefined) => {
    onChange(date);
    if (date) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : "Selecione a data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <div className="rounded-xl bg-popover shadow-lg p-4 min-w-[280px]">
          {/* Step: Year */}
          {step === "year" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setYearPageStart((p) => Math.max(1920, p - 20))}
                  disabled={yearPageStart <= 1920}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">
                  {Math.max(1920, yearPageStart)} – {Math.min(currentYear, yearPageStart + 19)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setYearPageStart((p) => p + 20)}
                  disabled={yearPageStart + 20 > currentYear}
                  className="h-7 w-7 p-0 rotate-180"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {years.map((y) => (
                  <Button
                    key={y}
                    variant={y === selectedYear ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 text-sm rounded-lg",
                      y === selectedYear && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleYearSelect(y)}
                  >
                    {y}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Month */}
          {step === "month" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("year")}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">{selectedYear}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS_PT.map((m, i) => (
                  <Button
                    key={i}
                    variant={i === selectedMonth ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 text-sm rounded-lg",
                      i === selectedMonth && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleMonthSelect(i)}
                  >
                    {m.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Day */}
          {step === "day" && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("month")}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold capitalize">
                  {MONTHS_PT[selectedMonth]} {selectedYear}
                </span>
              </div>
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDaySelect}
                month={calendarMonth}
                onMonthChange={() => {}}
                disabled={(date) => date > new Date() || date < new Date("1920-01-01")}
                locale={ptBR}
                className="p-0 pointer-events-auto"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
