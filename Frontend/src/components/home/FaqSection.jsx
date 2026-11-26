import React, { useState } from "react";

const faqData = [
  {
    question: "Can my child start as a complete beginner?",
    answer:
      "Yes. Tell us what your child has tried so far, and we’ll discuss a suitable starting point.",
  },
  {
    question: "How are live classes different from recorded practice?",
    answer:
      "Live classes are scheduled sessions with a teacher. Recorded practice uses prepared lessons to revisit learning between classes.",
  },
  {
    question: "How involved should a parent be?",
    answer:
      "Younger children may need help getting ready and using the learning space. Discuss the right level of support with your teacher.",
  },
  {
    question: "Which languages can teachers use?",
    answer:
      "Share your preference for English or Urdu during your introduction so we can discuss a suitable teacher.",
  },
  {
    question: "Will class times be shown in my timezone?",
    answer:
      "We’ll discuss your location and available times when arranging your introductory class.",
  },
  {
    question: "What happens after I book an introductory class?",
    answer:
      "We’ll discuss your child’s starting point, learning needs and suitable availability before arranging the next step.",
  },
];

export default function FaqSection({ onOpenSupportModal }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faqs" className="bg-ivory border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Column: Heading & Illustration */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight">
              A few things you
              <br />
              might be
              <br />
              wondering.
            </h2>

            <p className="text-base sm:text-lg text-muted leading-relaxed">
              Every family starts somewhere. Here are a few helpful answers before you take the next step.
            </p>

            <img
              src="https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/parent-updates_GrC8e56jWu.png"
              alt="A parent supporting a child's learning"
              loading="lazy"
              className="w-full h-56 sm:h-64 object-cover rounded-xl border border-border shadow-xs select-none"
            />

            <div>
              <button
                type="button"
                onClick={onOpenSupportModal}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4 cursor-pointer"
              >
                Ask us a question &rarr;
              </button>
            </div>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="lg:col-span-7 divide-y divide-border border-y border-border">
            {faqData.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <article
                  key={item.question}
                  className={`transition-colors py-5 ${
                    isOpen ? "bg-sage/40 -mx-4 px-4 rounded-xl" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-charcoal hover:text-primary transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <span
                      className={`text-xl sm:text-2xl font-bold shrink-0 transition-transform ${
                        isOpen ? "text-primary" : "text-muted"
                      }`}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
