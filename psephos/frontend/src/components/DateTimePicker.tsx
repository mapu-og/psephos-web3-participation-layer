"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, getYear, isValid, setHours, setMinutes } from "date-fns";
import { DayPicker } from "react-day-picker";
import { CalendarDays, ChevronDown } from "lucide-react";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: Date;
}

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = [0, 15, 30, 45];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseLocalDateTime(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DateTimePicker({ value, onChange, min }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"month" | "year" | "hour" | "minute" | null>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseLocalDateTime(value);
  const [displayMonth, setDisplayMonth] = useState<Date>(selectedDate ?? min ?? new Date());
  const selectedDateMs = selectedDate?.getTime();
  const minMs = min?.getTime();

  const selectedHour = selectedDate?.getHours() ?? 0;
  const selectedMinute = selectedDate?.getMinutes() ?? 0;
  const startYear = min ? getYear(min) : getYear(new Date()) - 1;
  const endYear = startYear + 6;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);

  useEffect(() => {
    setDisplayMonth(selectedDate ?? min ?? new Date());
  }, [selectedDateMs, minMs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const trigger = shellRef.current?.getBoundingClientRect();
      const popover = popoverRef.current?.getBoundingClientRect();
      if (!trigger || !popover) return;

      const spaceBelow = window.innerHeight - trigger.bottom;
      setOpenUpward(spaceBelow < popover.height + 20);
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    return () => window.removeEventListener("resize", updatePlacement);
  }, [open]);

  const displayValue = useMemo(() => {
    if (!selectedDate) return "Select deadline";
    return format(selectedDate, "MMM d, yyyy • HH:mm");
  }, [selectedDate]);

  const emitDate = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
  };

  const clampToMin = (date: Date) => {
    if (min && date < min) return min;
    return date;
  };

  const updateDatePart = (day?: Date) => {
    if (!day) return;
    const withHour = setHours(day, 0);
    const withMinutes = setMinutes(withHour, 0);
    emitDate(clampToMin(withMinutes));
  };

  const updateMonthValue = (monthIndex: number) => {
    const next = new Date(displayMonth);
    next.setMonth(monthIndex);
    setDisplayMonth(next);
    setOpenMenu(null);
  };

  const updateYearValue = (year: number) => {
    const next = new Date(displayMonth);
    next.setFullYear(year);
    setDisplayMonth(next);
    setOpenMenu(null);
  };

  const updateTimePart = (kind: "hour" | "minute", nextValue: number) => {
    const base = selectedDate ?? min ?? new Date();
    const withHour = setHours(base, kind === "hour" ? nextValue : selectedHour);
    const withMinutes = setMinutes(withHour, kind === "minute" ? nextValue : selectedMinute);
    emitDate(clampToMin(withMinutes));
    setOpenMenu(null);
  };

  return (
    <div className="date-time-shell" ref={shellRef}>
      <button
        type="button"
        className={`psephos-input date-trigger ${open ? "date-trigger-open" : ""}`}
        onClick={() => {
          setOpen((current) => !current);
          setOpenMenu(null);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="date-trigger-main">
          <CalendarDays size={16} />
          <span className={selectedDate ? "date-trigger-value" : "date-trigger-placeholder"}>
            {displayValue}
          </span>
        </span>
        <ChevronDown size={15} className={`date-trigger-chevron ${open ? "date-trigger-chevron-open" : ""}`} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className={`date-popover ${openUpward ? "date-popover-up" : ""}`}
          role="dialog"
          aria-label="Select deadline"
        >
          <div className="picker-toolbar">
            <div className="picker-select-shell picker-select-shell-month">
              <button
                type="button"
                className={`picker-select-trigger ${openMenu === "month" ? "picker-select-trigger-open" : ""}`}
                onClick={() => setOpenMenu((current) => (current === "month" ? null : "month"))}
              >
                <span>{MONTHS[displayMonth.getMonth()]}</span>
                <ChevronDown size={13} />
              </button>
              {openMenu === "month" && (
                <div className="picker-select-menu">
                  {MONTHS.map((monthLabel, index) => (
                    <button
                      key={monthLabel}
                      type="button"
                      className={`picker-select-option ${index === displayMonth.getMonth() ? "picker-select-option-active" : ""}`}
                      onClick={() => updateMonthValue(index)}
                    >
                      {monthLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="picker-select-shell picker-select-shell-year">
              <button
                type="button"
                className={`picker-select-trigger ${openMenu === "year" ? "picker-select-trigger-open" : ""}`}
                onClick={() => setOpenMenu((current) => (current === "year" ? null : "year"))}
              >
                <span>{displayMonth.getFullYear()}</span>
                <ChevronDown size={13} />
              </button>
              {openMenu === "year" && (
                <div className="picker-select-menu">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={`picker-select-option ${year === displayMonth.getFullYear() ? "picker-select-option-active" : ""}`}
                      onClick={() => updateYearValue(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={updateDatePart}
            disabled={min ? { before: min } : undefined}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            hideNavigation
            startMonth={new Date(startYear, 0)}
            endMonth={new Date(endYear, 11)}
            showOutsideDays
            fixedWeeks
            weekStartsOn={1}
            className="psephos-daypicker"
            classNames={{
              root: "rdp-root",
              months: "rdp-months",
              month: "rdp-month",
              month_caption: "rdp-caption sr-only",
              month_grid: "rdp-table",
              weekdays: "rdp-weekdays",
              weekday: "rdp-weekday",
              week: "rdp-row",
              weeks: "rdp-weeks",
              day: "rdp-cell",
              day_button: "rdp-day-button",
              selected: "rdp-selected",
              today: "rdp-today",
              outside: "rdp-outside",
              disabled: "rdp-disabled",
            }}
          />

          <div className="time-grid time-grid-inline">
            <div className="time-group time-group-inline">
              <span className="time-label">Hour</span>
              <div className="picker-select-shell picker-select-shell-time">
                <button
                  type="button"
                  className={`picker-select-trigger picker-select-trigger-time ${openMenu === "hour" ? "picker-select-trigger-open" : ""}`}
                  onClick={() => setOpenMenu((current) => (current === "hour" ? null : "hour"))}
                >
                  <span>{String(selectedHour).padStart(2, "0")}</span>
                  <ChevronDown size={13} />
                </button>
                {openMenu === "hour" && (
                  <div className="picker-select-menu picker-select-menu-time">
                    {HOURS.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        className={`picker-select-option ${hour === selectedHour ? "picker-select-option-active" : ""}`}
                        onClick={() => updateTimePart("hour", hour)}
                      >
                        {String(hour).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="time-group time-group-inline">
              <span className="time-label">Minute</span>
              <div className="picker-select-shell picker-select-shell-time">
                <button
                  type="button"
                  className={`picker-select-trigger picker-select-trigger-time ${openMenu === "minute" ? "picker-select-trigger-open" : ""}`}
                  onClick={() => setOpenMenu((current) => (current === "minute" ? null : "minute"))}
                >
                  <span>{String(selectedMinute).padStart(2, "0")}</span>
                  <ChevronDown size={13} />
                </button>
                {openMenu === "minute" && (
                  <div className="picker-select-menu picker-select-menu-time">
                    {MINUTES.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        className={`picker-select-option ${minute === selectedMinute ? "picker-select-option-active" : ""}`}
                        onClick={() => updateTimePart("minute", minute)}
                      >
                        {String(minute).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
