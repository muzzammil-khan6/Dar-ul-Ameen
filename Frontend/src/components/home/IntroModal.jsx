import React, { useState } from "react";
import Button from "../common/Button";
import { X, CheckCircle2 } from "lucide-react";

export default function IntroModal({ isOpen, onClose, modalData = { type: "intro" } }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    language: "English",
    timezone: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | busy | sent

  if (!isOpen) return null;

  const kind = modalData?.type || "intro";
  const program = modalData?.program;

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("busy");
    // Simulate instantaneous enquiry reception without external dependencies
    setTimeout(() => {
      setStatus("sent");
    }, 400);
  };

  const getTitle = () => {
    if (kind === "program" && program) return program.name;
    if (kind === "support") return "Ask us a question";
    return "Book an Introductory Class";
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative text-charcoal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-muted hover:text-charcoal rounded-lg hover:bg-sage transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-charcoal pr-8">
          {getTitle()}
        </h2>

        {kind === "program" && program ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {program.level} · Live + Practice
            </p>
            <p className="text-base text-muted leading-relaxed">
              {program.description}
            </p>
            <p className="text-sm text-charcoal/80 leading-relaxed">
              Live teacher-led guidance and prepared recorded practice. We’ll discuss a suitable starting point and availability during your introduction.
            </p>
            <div className="pt-2">
              <Button
                variant="cta"
                size="md"
                className="w-full"
                onClick={() => {
                  setStatus("idle");
                  modalData.type = "intro";
                }}
              >
                Book an Introductory Class
              </Button>
            </div>
          </div>
        ) : status === "sent" ? (
          <div className="mt-6 py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-sage text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-charcoal">
              Thank You!
            </h3>
            <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">
              Your details have been received. Our coordinator will contact you shortly to confirm your session.
            </p>
            <div className="pt-3">
              <Button variant="primary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-xs text-muted">
              {kind === "intro"
                ? "Share a little about your child. We’ll discuss a starting point together."
                : "Tell us how we can help your family."}
            </p>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Parent's Name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-ivory text-sm text-charcoal focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-ivory text-sm text-charcoal focus:outline-hidden focus:border-primary"
              />
            </div>

            {kind === "intro" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Child's Age *
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="18"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g. 7"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-ivory text-sm text-charcoal focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-ivory text-sm text-charcoal focus:outline-hidden focus:border-primary cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Country / Timezone *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder="e.g. UK / London"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-ivory text-sm text-charcoal focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-ivory text-sm text-charcoal focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                {kind === "support"
                  ? "Your Question *"
                  : "Learning Level / Preferred Timing *"}
              </label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={
                  kind === "support"
                    ? "How can we help?"
                    : "Tell us what your child has learned so far..."
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-ivory text-sm text-charcoal focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={status === "busy"}
              >
                {kind === "support"
                  ? "Send Question"
                  : "Request Introductory Class"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
