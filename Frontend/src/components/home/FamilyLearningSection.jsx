import React from "react";

export default function FamilyLearningSection() {
  return (
    <section className="bg-ivory border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Column: Copy & Feedback */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight">
              Stay close to
              <br />
              their learning.
            </h2>

            <p className="text-base sm:text-lg text-muted leading-relaxed">
              Know what your child is practising, where they’re growing and how you can help.
            </p>

            <div className="p-6 rounded-xl bg-sage border border-border space-y-2">
              <span className="text-xs uppercase font-bold text-primary tracking-wider block">
                Teacher feedback
              </span>
              <p className="text-base sm:text-lg font-semibold text-charcoal italic leading-relaxed">
                “Amina is recognising ا and ب confidently. Try ت together next.”
              </p>
            </div>
          </div>

          {/* Right Column: Family Learning Photo */}
          <div className="lg:col-span-7">
            <img
              src="https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/family-learning_nAtktdqDLo.png"
              alt="Mother and child learning together"
              loading="lazy"
              className="w-full h-[360px] sm:h-[440px] object-cover rounded-2xl border border-border shadow-sm select-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
