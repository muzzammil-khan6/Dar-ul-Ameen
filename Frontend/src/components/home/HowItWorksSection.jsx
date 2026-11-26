import React, { useState } from "react";
import Button from "../common/Button";

const steps = [
  {
    number: "01",
    title: "Meet and learn",
    description: "A teacher-led session with a clear starting point.",
  },
  {
    number: "02",
    title: "Practise a little",
    description: "Return to a short lesson or guided activity.",
  },
  {
    number: "03",
    title: "Stay connected",
    description: "See feedback and understand the next step.",
  },
];

export default function HowItWorksSection({ onOpenIntroModal }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="bg-sage border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight mb-12">
          A simple rhythm.
          <br />
          Meaningful progress.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Panel: Dynamic Visual per Step */}
          <div className="lg:col-span-7">
            {activeStep === 0 && (
              <div className="relative h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
                <img
                  src="https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/learning-week_oULFtQVouC.png"
                  alt="Child learning with a teacher online"
                  loading="lazy"
                  className="w-full h-full object-cover select-none"
                />
                <div className="absolute bottom-5 left-5 bg-primary text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md">
                  Teacher-led learning
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="h-[360px] sm:h-[420px] rounded-2xl p-8 bg-white border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-xs uppercase font-bold text-primary tracking-wider">
                  Prepared practice
                </span>
                <h3 className="text-2xl font-bold text-charcoal">
                  Listen and recognise
                </h3>
                <div className="text-6xl sm:text-7xl font-ar text-primary py-3 select-none" dir="rtl">
                  ا ب ت
                </div>
                <p className="text-sm text-muted">Listen. Recognise. Try again.</p>
                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={onOpenIntroModal}>
                    Explore guided practice
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="h-[360px] sm:h-[420px] rounded-2xl p-8 bg-white border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-5">
                <span className="text-xs uppercase font-bold text-primary tracking-wider">
                  Parent-visible feedback
                </span>
                <h3 className="text-2xl font-bold text-charcoal">
                  One small step forward.
                </h3>
                <div className="p-6 rounded-xl bg-sage border border-border text-charcoal text-base sm:text-lg max-w-md font-medium leading-relaxed italic">
                  “Amina is recognising ا and ب confidently. Try ت together next.”
                </div>
                <p className="text-xs text-muted">Illustrative teacher feedback</p>
              </div>
            )}
          </div>

          {/* Right Panel: Interactive Tabs */}
          <div className="lg:col-span-5 space-y-3">
            {steps.map((st, idx) => {
              const isSelected = activeStep === idx;
              return (
                <button
                  key={st.number}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-6 rounded-xl transition-all duration-200 border cursor-pointer flex items-start gap-5 ${
                    isSelected
                      ? "bg-white border-border border-l-4 border-l-amber shadow-sm"
                      : "bg-transparent border-transparent hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`text-xl sm:text-2xl font-bold shrink-0 ${
                      isSelected ? "text-primary" : "text-muted"
                    }`}
                  >
                    {st.number}
                  </span>
                  <div>
                    <h3
                      className={`text-lg sm:text-xl font-bold ${
                        isSelected ? "text-primary" : "text-charcoal"
                      }`}
                    >
                      {st.title}
                    </h3>
                    <p className="text-sm text-muted mt-1 leading-relaxed">
                      {st.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
