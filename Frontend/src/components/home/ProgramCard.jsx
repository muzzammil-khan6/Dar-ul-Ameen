import React from "react";

export default function ProgramCard({ program, onExplore }) {
  return (
    <article className="bg-white border border-border rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <img
          src={program.image}
          alt={program.name}
          loading="lazy"
          className="h-56 sm:h-60 w-full object-cover select-none"
        />
        <div className="p-6 space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            {program.level} · Live + Practice
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-charcoal">
            {program.name}
          </h3>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            {program.description}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          type="button"
          onClick={() => onExplore(program)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4 cursor-pointer"
        >
          Explore program &rarr;
        </button>
      </div>
    </article>
  );
}
