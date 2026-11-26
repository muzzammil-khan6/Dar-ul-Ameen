import React, { useState } from "react";
import Button from "../common/Button";

const daysList = [
  { day: "Mon", date: 16 },
  { day: "Tue", date: 17 },
  { day: "Wed", date: 18 },
  { day: "Thu", date: 19 },
  { day: "Fri", date: 20 },
];

const timeSlots = ["15:30", "16:00", "17:30"];

export default function ScheduleSection({ onOpenIntroModal }) {
  const [selectedDay, setSelectedDay] = useState(16);
  const [selectedTime, setSelectedTime] = useState("15:30");

  return (
    <section id="schedule" className="bg-ivory border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Column: Context */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight">
              Learning that fits
              <br />
              family life.
            </h2>

            <p className="text-base sm:text-lg text-muted leading-relaxed">
              Choose from available local times and share a routine that works for your family.
            </p>

            <p className="text-sm sm:text-base font-semibold text-primary">
              Teaching language: English / <span lang="ur">اردو</span>
            </p>
          </div>

          {/* Right Column: Interactive Schedule Card */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="text-xl font-bold text-charcoal">
                  Find your moment
                </h3>
                <p className="text-xs text-muted mt-1">
                  Europe/London · GMT (UTC+0) · November 2026
                </p>
              </div>

              {/* Day selection */}
              <div>
                <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
                  Select Day
                </p>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {daysList.map((d) => {
                    const isSelected = selectedDay === d.date;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setSelectedDay(d.date)}
                        className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white shadow-xs"
                            : "bg-ivory border border-border text-charcoal hover:bg-sage"
                        }`}
                      >
                        <span className={`text-xs ${isSelected ? "text-white/80" : "text-muted"}`}>
                          {d.day}
                        </span>
                        <strong className="text-lg font-bold mt-1">
                          {d.date}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
                  Available Slots
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((t) => {
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white shadow-xs"
                            : "bg-ivory border border-border text-primary hover:bg-sage"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted">
                  Illustrative availability · local time shown
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenIntroModal}
                  className="w-full sm:w-auto"
                >
                  Book Slot
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
