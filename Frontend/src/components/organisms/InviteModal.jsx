// Job: Invite friends modal organism for sharing link, WhatsApp, email, and phone contact invites
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "./Modal";
import Button from "../atoms/Button";
import FormField from "../molecules/FormField";
import CopyLinkBox from "../molecules/CopyLinkBox";
import PriceText from "../atoms/PriceText";
import {
  Share2,
  Mail,
  Phone,
  Gift,
  Users,
  Coins,
  Copy,
  Check,
} from "lucide-react";
import {
  fetchInviteSummary,
  sendEmailInvite,
  createPhoneInvite,
  clearInviteMessage,
} from "../../store/slices/inviteSlice";

export default function InviteModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const {
    inviteLink = "",
    whatsappUrl = "",
    stats = { totalInvited: 0, totalJoined: 0, totalRewarded: 0, totalEarned: 0 },
    sendingEmail = false,
    creatingPhone = false,
    error = null,
    successMessage = null,
  } = useSelector((state) => state.invite || {});

  const [activeTab, setActiveTab] = useState("link");
  const [emailForm, setEmailForm] = useState({ email: "", name: "" });
  const [phoneForm, setPhoneForm] = useState({ phone: "", name: "" });
  const [generatedPhoneText, setGeneratedPhoneText] = useState("");
  const [copiedPhoneText, setCopiedPhoneText] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchInviteSummary());
      dispatch(clearInviteMessage());
    }
  }, [isOpen, dispatch]);

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
    if (res.meta.requestStatus === "fulfilled" && res.payload?.shareText) {
      setGeneratedPhoneText(res.payload.shareText);
    }
  };

  const handleCopyPhoneText = () => {
    if (!generatedPhoneText) return;
    navigator.clipboard.writeText(generatedPhoneText);
    setCopiedPhoneText(true);
    setTimeout(() => setCopiedPhoneText(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Friends & Earn Rewards" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Reward Highlight */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-amber-300" />
            <div>
              <h4 className="text-xs font-bold">Earn Rs. 100 per friend!</h4>
              <p className="text-[11px] text-emerald-100">When your friend completes their first paid 1v1 booking.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-100 block">Total Earned</span>
            <PriceText amount={stats.totalEarned || 0} size="md" className="text-white" />
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200">
          {[
            { id: "link", label: "Copy Link & WhatsApp", icon: Share2 },
            { id: "email", label: "Email Invite", icon: Mail },
            { id: "phone", label: "Phone Contact", icon: Phone },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === t.id
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/30"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "link" && (
          <div className="space-y-3 pt-1">
            <CopyLinkBox text={inviteLink} label="Your Unique Referral Link" />
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="primary" size="md" className="w-full bg-[#25D366] hover:bg-[#20ba59]">
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Share on WhatsApp
                </Button>
              </a>
            )}
          </div>
        )}

        {activeTab === "email" && (
          <form onSubmit={handleSendEmail} className="space-y-3 pt-1">
            <FormField
              label="Friend's Name (Optional)"
              placeholder="e.g. Ali"
              value={emailForm.name}
              onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
            />
            <FormField
              label="Friend's Email Address"
              type="email"
              placeholder="ali@example.com"
              value={emailForm.email}
              onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
              required
            />
            <Button type="submit" variant="primary" size="md" isLoading={sendingEmail} className="w-full">
              Send Email Invite
            </Button>
          </form>
        )}

        {activeTab === "phone" && (
          <form onSubmit={handleCreatePhone} className="space-y-3 pt-1">
            <FormField
              label="Contact Name"
              placeholder="e.g. Fatima"
              value={phoneForm.name}
              onChange={(e) => setPhoneForm({ ...phoneForm, name: e.target.value })}
            />
            <FormField
              label="Phone Number"
              placeholder="+92 300 1234567"
              value={phoneForm.phone}
              onChange={(e) => setPhoneForm({ ...phoneForm, phone: e.target.value })}
              required
            />
            <Button type="submit" variant="primary" size="md" isLoading={creatingPhone} className="w-full">
              Generate Invite Message
            </Button>
            {generatedPhoneText && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{generatedPhoneText}</p>
                <Button size="sm" variant="outline" onClick={handleCopyPhoneText} className="w-full">
                  {copiedPhoneText ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedPhoneText ? "Copied Message!" : "Copy Message to Clipboard"}
                </Button>
              </div>
            )}
          </form>
        )}

        {/* Feedback messages */}
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {successMessage && <p className="text-xs text-emerald-600 font-medium">{successMessage}</p>}
      </div>
    </Modal>
  );
}
