import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import HeroSection from "../../components/home/HeroSection";
import ProgramsSection from "../../components/home/ProgramsSection";
import HowItWorksSection from "../../components/home/HowItWorksSection";
import FeaturesSection from "../../components/home/FeaturesSection";
import FamilyLearningSection from "../../components/home/FamilyLearningSection";
import TeachersSection from "../../components/home/TeachersSection";
import ScheduleSection from "../../components/home/ScheduleSection";
import VisionSection from "../../components/home/VisionSection";
import FaqSection from "../../components/home/FaqSection";
import FinalCtaSection from "../../components/home/FinalCtaSection";
import IntroModal from "../../components/home/IntroModal";

export default function Home() {
  const { user, activeRole } = useSelector((state) => state.auth || {});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ type: "intro" });

  // Home page is reserved exclusively for unauthenticated visitors
  if (user) {
    const role =
      activeRole || (Array.isArray(user.role) ? user.role[0] : user.role);
    if (role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  const handleOpenModal = (type = "intro", program = null) => {
    setModalData({ type, program });
    setModalOpen(true);
  };

  return (
    <div className="bg-ivory text-charcoal font-sans selection:bg-amber selection:text-charcoal">
      {/* 1. Hero Section */}
      <HeroSection onOpenIntroModal={() => handleOpenModal("intro")} />

      {/* 2. Programs / Courses Section (White) */}
      <ProgramsSection
        onExploreProgram={(prog) => handleOpenModal("program", prog)}
      />

      {/* 3. How It Works Section (Soft Sage) */}
      <HowItWorksSection onOpenIntroModal={() => handleOpenModal("intro")} />

      {/* 4. Teacher Guidance & Real-time Features (Deep Teal) */}
      <FeaturesSection />

      {/* 5. Family Learning & Parent Updates (Warm Ivory) */}
      <FamilyLearningSection />

      {/* 6. Qualified Tutors Section (Soft Sage) */}
      {/* <TeachersSection /> */}

      {/* 7. Schedule & Family Routine (Warm Ivory) */}
      {/* <ScheduleSection onOpenIntroModal={() => handleOpenModal("intro")} /> */}

      {/* 8. Vision & Future Learning Areas (Soft Sage) */}
      <VisionSection />

      {/* 9. FAQs Section (Warm Ivory) */}
      <FaqSection onOpenSupportModal={() => handleOpenModal("support")} />

      {/* 10. Final Call to Action (Soft Sage with Golden Amber CTA) */}
      <FinalCtaSection onOpenIntroModal={() => handleOpenModal("intro")} />

      {/* Interactive Introductory / Program Modal */}
      <IntroModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        modalData={modalData}
      />
    </div>
  );
}
