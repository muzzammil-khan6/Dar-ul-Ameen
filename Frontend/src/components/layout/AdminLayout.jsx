// Job: Admin portal dashboard layout wrapper delegating to atomic DashboardLayout
import { useState } from "react";
import Sidebar from "../organisms/Sidebar";
import Header from "../organisms/Header";

export default function AdminLayout({ children, className = "" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  return (
      <div className="min-h-screen bg-ivory font-sans text-charcoal flex">
        <Sidebar
          role={"admin"}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
  
        {/* Main Content Area: ZERO gap between Sidebar and Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Header
            role={"admin"}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className={`flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto ${className}`}>
            {children}
          </main>
        </div>
      </div>
  );
}

