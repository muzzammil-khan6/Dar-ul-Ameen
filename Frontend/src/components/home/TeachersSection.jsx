import React from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";

const sampleTeachers = [
  {
    id: "maryam",
    name: "Maryam Ali",
    languages: "English & Urdu",
    bio: "A calm, encouraging approach to early Quran learning.",
    portrait: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/maryam-portrait_84kMzTWom.png",
  },
  {
    id: "hassan",
    name: "Hassan Raza",
    languages: "English & Urdu",
    bio: "Thoughtful, step-by-step support with reading and pronunciation.",
    portrait: "https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/hassan-portrait_rG69uVtbH.png",
  },
];

export default function TeachersSection() {
  return (
    <section id="teachers" className="bg-sage border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Column: Heading & Context */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight">
              Patient guidance.
              <br />
              A personal
              <br />
              connection.
            </h2>

            <p className="text-base sm:text-lg text-muted leading-relaxed">
              Meet the people who make each small step feel possible.
            </p>

            <p className="text-base sm:text-lg font-semibold text-primary leading-relaxed">
              English and Urdu teaching options.
              <br />
              A thoughtful match for your family.
            </p>

            <div className="pt-2">
              <Link to="/teachers">
                <Button variant="primary" size="md">
                  View All Tutors
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Teacher Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sampleTeachers.map((teacher) => (
              <article
                key={teacher.id}
                className="bg-white border border-border rounded-xl p-5 flex flex-col space-y-3 shadow-xs"
              >
                <img
                  src={teacher.portrait}
                  alt={`${teacher.name} — Teacher Portrait`}
                  loading="lazy"
                  className="h-64 sm:h-72 w-full object-cover rounded-lg select-none"
                />
                <h3 className="text-xl font-bold text-charcoal">
                  {teacher.name}
                </h3>
                <span className="text-sm font-semibold text-primary">
                  {teacher.languages}
                </span>
                <p className="text-sm text-muted leading-relaxed">
                  {teacher.bio}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
