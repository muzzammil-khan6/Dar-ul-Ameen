import Button from "../common/Button";
import { Link, useNavigate } from "react-router-dom";

export default function HeroSection({ onOpenIntroModal }) {

    const navigate = useNavigate();
  return (
    <section className="relative min-h-[620px] sm:min-h-[700px] flex items-center overflow-hidden select-none">
      {/* Background Hero Image */}
      <img
        src="https://ik.imagekit.io/muzzammilk6/Dar-ul-Ameen/hero-banner_KzcYzp9O4V.png"
        alt="Mother guiding her child through a Quran lesson at home"
        className="absolute inset-0 w-full h-full object-cover object-[65%_center] sm:object-center select-none"
        loading="eager"
      />

      {/* Hero Visual Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#062220]/95 via-[#092c29]/80 to-transparent" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-white w-full">
        <div className="max-w-2xl space-y-5">
          <p className="text-xs sm:text-sm font-bold tracking-wide text-amber uppercase">
            Online Quran learning for children
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.12]">
            A meaningful beginning.
            <br />
            A lifelong connection.
          </h1>

          <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
            Help your child grow in Quran learning with live teacher-led lessons and guided practice, wherever your family calls home.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            
            <Link to="/teachers">
            <Button
              variant="cta"
              size="lg"
              className="w-full sm:w-auto"
            >
              Book an Introductory Class
            </Button>
          </Link> 
           

            <a href="#programs" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white text-black hover:bg-white/10"
              >
                Explore Programs
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
