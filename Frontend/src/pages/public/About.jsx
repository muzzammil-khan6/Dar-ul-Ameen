// Job: About page for Dar-ul-Ameen using the official theme
import React, { memo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BookOpen,
  Award,
  Sparkles,
} from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { getImage } from "../../utils/imagekit";

function About() {
  const pillars = [
    {
      icon: BookOpen,
      title: "Authentic Islamic Knowledge",
      desc: "Rooted in authentic Quran and Sunnah, preserving traditional Islamic sciences with contemporary pedagogical standards.",
    },
    {
      icon: ShieldCheck,
      title: "Vetted & Certified Scholars",
      desc: "Every tutor undergoes comprehensive background verification, Tajweed audits, and pedagogical training.",
    },
    {
      icon: Award,
      title: "1v1 Personalized Mentorship",
      desc: "Tailored schedules and individual attention designed for focused Quran recitation, Arabic fluency, and academic success.",
    },
    {
      icon: Sparkles,
      title: "Trust & Transparency",
      desc: "Clear per-hour rates, secure wallet transactions, money-back guarantees, and parent-accessible monitoring.",
    },
  ];

  return (
    <div className="bg-ivory text-charcoal min-h-screen">
      {/* 1. Header / Hero Section (Ivory) */}
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage border border-border text-primary text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber" />
            <span className="tracking-wide">
              Knowledge • Peace • Trust
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-charcoal tracking-tight max-w-3xl mx-auto leading-tight">
            About Dar-ul-Ameen
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            A premium Islamic learning sanctuary connecting dedicated students worldwide with certified Quran, Arabic, and academic mentors for transformative 1v1 education.
          </p>

          {/* Core Visual Banner */}
          <div className="mt-10 max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-sm border border-border bg-white">
            <img
              src={getImage("hero.png", 1200)}
              alt="Dar-ul-Ameen Sanctuary"
              width={1200}
              height={400}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.style.display = "none";
              }}
              className="w-full h-auto max-h-[360px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Mission & Philosophy (Sage) */}
      <section className="py-16 sm:py-20 border-b border-border bg-sage">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block mb-2">
            Our Sacred Mission
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-charcoal mb-4">
            Empowering Minds, Nurturing Faith
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-3xl mx-auto">
            Dar-ul-Ameen was established to bridge geographical boundaries and make elite Islamic scholarship accessible from the comfort of your home. Whether learning the fundamentals of Arabic phonetics, mastering Hifz with proper Tajweed, or deepening understanding in Islamic jurisprudence, our structured curriculum and verified teachers offer an exceptional educational journey.
          </p>
        </div>
      </section>

      {/* 3. Core Pillars (Ivory) */}
      <section className="py-16 sm:py-20 bg-ivory border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest block mb-1">
              Why Choose Dar-ul-Ameen
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal">
              Built On Integrity and Scholarly Excellence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <Card
                  key={idx}
                  hover
                  className="p-6 bg-white border border-border rounded-xl shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-4 shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-charcoal text-base mb-2">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Call to Action (Deep Teal / Primary) */}
      <section className="py-16 bg-primary text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Begin Your Sacred Learning Path Today
          </h2>
          <p className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Book your free trial class with a verified tutor or apply to teach on our global platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/teachers">
              <Button
                variant="cta"
                size="lg"
                className="w-full sm:w-auto"
              >
                Find a Tutor
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/25"
              >
                Become a Tutor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(About);
