import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Copy,
  Check,
  Share2,
  Mail,
  Phone,
  Gift,
  Users,
  CheckCircle2,
  Clock,
  Coins,
  Send,
  ExternalLink,
} from "lucide-react";
import Modal from "../common/Modal";
import {
  fetchInviteSummary,
  sendEmailInvite,
  createPhoneInvite,
  clearInviteMessage,
} from "../../store/slices/inviteSlice";

export default function InviteModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const {
    inviteCode = "",
    inviteLink = "",
    whatsappUrl = "",
    whatsappShareText = "",
    stats = { totalInvited: 0, totalJoined: 0, totalRewarded: 0, totalEarned: 0 },
    invites = [],
    loading = false,
    sendingEmail = false,
    creatingPhone = false,
    error = null,
    successMessage = null,
  } = useSelector((state) => state.invite || {});

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhoneText, setCopiedPhoneText] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: "", name: "" });
  const [phoneForm, setPhoneForm] = useState({ phone: "", name: "" });
  const [generatedPhoneText, setGeneratedPhoneText] = useState("");
  const [activeTab, setActiveTab] = useState("link"); // link, email, phone

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchInviteSummary());
      dispatch(clearInviteMessage());
    }
  }, [isOpen, dispatch]);

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.email.trim()) return;
    const res = await dispatch(sendEmailInvite(emailForm));
    if (res.meta.requestStatus === "fulfilled") {
      setEmailForm({ email: "", name: "" });
    }
  };

  const handleCreatePhone = async (e) => {
    e.preventDefault();
    if (!phoneForm.phone.trim()) return;
    const res = await dispatch(createPhoneInvite(phoneForm));
    if (res.meta.requestStatus === "fulfilled") {
      setGeneratedPhoneText(
        res.payload?.shareText ||
          `Hey ${phoneForm.name || "friend"}! Join me on Dar-ul-Ameen for 1v1 Classes. Sign up here: ${inviteLink}`,
      );
      setPhoneForm({ phone: "", name: "" });
    }
  };

  const handleCopyPhoneText = () => {
    if (!generatedPhoneText) return;
    navigator.clipboard.writeText(generatedPhoneText);
    setCopiedPhoneText(true);
    setTimeout(() => setCopiedPhoneText(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Friends & Earn Rs. 100"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Bonus Reward Header Card */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
                Referral Program
              </span>
            </div>
            <h4 className="text-xl font-bold">Earn Rs. 100 per Friend</h4>
            <p className="text-xs text-emerald-100 max-w-sm mt-1">
              When a friend joins with your link and completes their first paid 1v1 booking, you get a Rs. 100 wallet bonus instantly!
            </p>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
            <div className="text-xs text-emerald-100">Total Earned</div>
            <div className="text-2xl font-extrabold text-amber-300">
              Rs. {stats?.totalEarned || 0}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Invited
            </div>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {stats?.totalInvited || 0}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Joined
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {stats?.totalJoined || 0}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500" /> Rewarded
            </div>
            <div className="text-xl font-bold text-amber-600 mt-1">
              {stats?.totalRewarded || 0}
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "link"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Share2 className="w-4 h-4" /> Share Link & WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "email"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mail className="w-4 h-4" /> Invite via Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("phone")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "phone"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Phone className="w-4 h-4" /> Phone Contact
          </button>
        </div>

        {/* Tab 1: Share Link & WhatsApp */}
        {activeTab === "link" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Your Unique Invite Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink || "Generating invite link..."}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold rounded-lg shadow-sm transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" /> Share on WhatsApp
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Email Invite */}
        {activeTab === "email" && (
          <form onSubmit={handleSendEmail} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Friend's Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ali Khan"
                  value={emailForm.name}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, name: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Friend's Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ali@example.com"
                  value={emailForm.email}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, email: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sendingEmail}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {sendingEmail ? (
                "Sending Invitation..."
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Email Invitation
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Phone Contact (Shareable Text) */}
        {activeTab === "phone" && (
          <div className="space-y-3">
            <form onSubmit={handleCreatePhone} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Friend's Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fatima"
                    value={phoneForm.name}
                    onChange={(e) =>
                      setPhoneForm({ ...phoneForm, name: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="03001234567"
                    value={phoneForm.phone}
                    onChange={(e) =>
                      setPhoneForm({ ...phoneForm, phone: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creatingPhone}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {creatingPhone ? "Preparing..." : "Generate Shareable Text"}
              </button>
            </form>

            {generatedPhoneText && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 mt-3">
                <div className="text-xs font-medium text-slate-600">
                  Ready to copy & paste via SMS or Chat:
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-700 whitespace-pre-wrap">
                  {generatedPhoneText}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPhoneText}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  {copiedPhoneText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Text!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Message Text
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Invited Friends List & Status */}
        <div className="border-t border-slate-200 pt-4">
          <h5 className="text-sm font-semibold text-slate-800 mb-3 flex items-center justify-between">
            <span>Your Invited Contacts ({invites?.length || 0})</span>
            <span className="text-xs text-slate-500 font-normal">
              Updated automatically
            </span>
          </h5>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Loading invited contacts...
            </div>
          ) : !invites || invites.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
              No contacts invited yet. Share your invite link or WhatsApp above!
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {invites.map((inv) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {(inv.joinedUser?.fullName || inv.invitedName || inv.invitedEmail || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {inv.joinedUser?.fullName || inv.invitedName || inv.invitedEmail || inv.invitedPhone}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {inv.invitedEmail || inv.invitedPhone || "Invited via Link"}
                      </div>
                    </div>
                  </div>

                  <div>
                    {inv.status === "rewarded" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Rewarded (+Rs. {inv.rewardAmount || 100})
                      </span>
                    ) : inv.status === "joined" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        Joined (Pending Booking)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Signup
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
