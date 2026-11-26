// Job: Teacher portal dashboard layout wrapper delegating to atomic DashboardLayout
import { useState } from "react";
import Sidebar from "../organisms/Sidebar";
import Header from "../organisms/Header";


export default function TeacherLayout({ children, title="", subtitle="", className = "" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  return (
      <div className="min-h-screen bg-ivory font-sans text-charcoal flex">
        {/* Sidebar: w-[260px] shrink-0 sticky top-0 h-screen bg-white border-r border-border z-40 */}
        <Sidebar
          role={"teacher"}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
  
        {/* Main Content Area: ZERO gap between Sidebar and Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Header
            title={title}
            subtitle={subtitle}
            role={"teacher"}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className={`flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto ${className}`}>
            {children}
          </main>
        </div>
      </div>
  );
}
