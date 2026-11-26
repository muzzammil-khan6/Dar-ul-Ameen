import React from "react";

const visionAreas = [
  {
    id: "early-years",
    title: "Early Years",
    description: "Curiosity, confidence and hands-on discovery.",
    image: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/early-years_4UBGZVMozj.png",
  },
  {
    id: "school-learning",
    title: "School Learning",
    description: "A wider world of books, questions and ideas.",
    image: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/school-learning_MnQGUO2Whz.png",
  },
  {
    id: "technology",
    title: "Technology & Innovation",
    description: "Computing, coding and thoughtful making.",
    image: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/technology_8tv7PPBy2.png",
  },
];

export default function VisionSection() {
  return (
    <section id="vision" className="bg-sage border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight">
              A beginning with room to grow.
            </h2>
            <p className="text-base sm:text-lg text-muted mt-3 max-w-xl">
              Starting with Quran learning, with a broader world of education ahead.
            </p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Future learning areas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {visionAreas.map((area) => (
            <article
              key={area.id}
              className="bg-white border border-border rounded-xl p-5 shadow-xs flex flex-col space-y-4"
            >
              <img
                src={area.image}
                alt={`${area.title} learning activity`}
                loading="lazy"
                className="h-56 sm:h-64 w-full object-cover rounded-lg select-none"
              />
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-primary">
                  {area.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {area.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
