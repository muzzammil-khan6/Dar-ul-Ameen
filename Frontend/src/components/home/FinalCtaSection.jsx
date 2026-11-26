import React from "react";
import Button from "../common/Button";

import { Link, useNavigate } from "react-router-dom";

export default function FinalCtaSection({ onOpenIntroModal }) {
  
  const navigate = useNavigate();
  return (
    <section className="bg-sage border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal leading-tight">
              Let’s find the right beginning
              <br className="hidden sm:inline" />
              for your child.
            </h2>
            <p className="text-base sm:text-lg text-muted mt-3 leading-relaxed">
              Share a little about your child. We’ll discuss a starting point together.
            </p>
          </div>

  <Link to="/teachers">
            <Button
              variant="cta"
              size="lg"
              className="w-full sm:w-auto"
            >
              Book an Introductory Class
            </Button>
          </Link> 
        </div>
      </div>
    </section>
  );
}
