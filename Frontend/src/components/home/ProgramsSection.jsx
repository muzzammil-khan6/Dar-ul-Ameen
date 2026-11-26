import React from "react";
import ProgramCard from "./ProgramCard";

export const defaultPrograms = [
  {
    id: "foundations",
    name: "Quran Foundations",
    level: "Beginner",
    description: "Recognise Arabic letters and build a confident beginning.",
    image: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/program-foundations_iidcExY0y.png",
  },
  {
    id: "reading",
    name: "Quran Reading",
    level: "Developing reader",
    description: "Connect letters and develop a more fluent reading rhythm.",
    image: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/program-reading_jd1N9Hu_4.png",
  },
  {
    id: "tajweed",
    name: "Tajweed Foundations",
    level: "Foundational tajweed",
    description: "Listen closely and practise clear, careful pronunciation.",
    image: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/program-tajweed_FmgVnU_5Jh.png",
  },
];

export default function ProgramsSection({ onExploreProgram }) {
  return (
    <section id="programs" className="bg-white border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end mb-12">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight">
              A strong foundation,
              <br className="hidden sm:inline" />
              at their pace.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lg text-muted leading-relaxed">
              Thoughtful starting points for your child’s Quran journey. Live guidance, with space to practise.
            </p>
          </div>
        </div>

        {/* 3 Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {defaultPrograms.map((prog) => (
            <ProgramCard
              key={prog.id}
              program={prog}
              onExplore={onExploreProgram}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
