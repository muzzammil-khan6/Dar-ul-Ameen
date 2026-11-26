import React from "react";

export default function FeaturesSection() {
  return (
    <section className="bg-primary text-white border-b border-primaryDark py-16 sm:py-20 lg:py-24 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-12">
          A teacher to guide.
          <br />
          Space to make it your own.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Large Feature Card */}
          <article className="bg-white rounded-xl border border-border overflow-hidden text-charcoal flex flex-col justify-between shadow-sm">
            <img
              src="https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/teacher-online_9r70GYgeSl.png"
              alt="Teacher supporting a child's online lesson"
              loading="lazy"
              className="h-64 sm:h-72 w-full object-cover"
            />
            <div className="p-6 sm:p-8 space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-charcoal">
                Together, in real time.
              </h3>
              <p className="text-sm sm:text-base text-muted leading-relaxed">
                Patient, personal guidance helps your child ask questions and grow in confidence.
              </p>
            </div>
          </article>

          {/* Small Feature Cards Stack */}
          <div className="flex flex-col gap-6 justify-between">
            <article className="bg-white rounded-xl border border-border overflow-hidden text-charcoal p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
              <img
                src="https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/practice_k0gTDX6c2.png"
                alt="Child practicing Quran lesson"
                loading="lazy"
                className="w-full sm:w-44 h-40 sm:h-36 object-cover rounded-lg shrink-0"
              />
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-charcoal">
                  Confidence, one little practice at a time.
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Prepared lessons make revisiting a new idea feel manageable.
                </p>
              </div>
            </article>

            <article className="bg-white rounded-xl border border-border overflow-hidden text-charcoal p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
              <img
                src="https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/parent-updates_GrC8e56jWu.png"
                alt="Parent reviewing student progress"
                loading="lazy"
                className="w-full sm:w-44 h-40 sm:h-36 object-cover rounded-lg shrink-0"
              />
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-charcoal">
                  Know their next small step.
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Clear feedback helps you support learning without the guesswork.
                </p>
              </div>
            </article>
          </div>
        </div>

        {/* Feature footnote */}
        <p className="mt-8 text-xs sm:text-sm text-white/75 leading-relaxed max-w-3xl">
          Recorded practice uses prepared learning materials. A child’s live-session recording is a separate, policy-dependent option—not included by default.
        </p>
      </div>
    </section>
  );
}
