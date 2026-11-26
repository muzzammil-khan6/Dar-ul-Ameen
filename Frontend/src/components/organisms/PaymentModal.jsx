// Job: 1v1 Booking payment modal organism supporting Wallet and Manual transfer
import React, { useState } from "react";
import Modal from "./Modal";
import PaymentOptionCard from "./PaymentOptionCard";
import Button from "../atoms/Button";
import FormField from "../molecules/FormField";
import PriceText from "../atoms/PriceText";
import PriceRow from "../molecules/PriceRow";
import { Wallet, Landmark, Copy, Check } from "lucide-react";

export default function PaymentModal({
  isOpen = false,
  onClose,
  booking,
  walletBalance = 0,
  paymentSettings,
  onPayViaWallet,
  onPayViaManual,
  isLoading = false,
  error = "",
}) {
  const [option, setOption] = useState("wallet");
  const [txId, setTxId] = useState("");
  const [proof, setProof] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  if (!booking) return null;
  const price = booking.totalPrice || booking.rate || 0;
  const canPayWallet = walletBalance >= price;

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProof(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (option === "wallet") {
      onPayViaWallet?.(booking._id);
    } else {
      onPayViaManual?.(booking._id, txId, proof);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pay for 1v1 Booking" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Booking Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-xs text-slate-500 font-medium block">
            Subject: <strong className="text-slate-800">{booking.subject}</strong>
          </span>
          <PriceRow label="Total Amount to Pay" amount={price} isTotal size="lg" />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">Select Payment Method:</span>
          <PaymentOptionCard
            icon={Wallet}
            title="Pay with Student Wallet"
            subtitle={canPayWallet ? "Instant activation" : "Insufficient wallet balance"}
            balance={walletBalance}
            isSelected={option === "wallet"}
            disabled={!canPayWallet}
            onClick={() => setOption("wallet")}
          />
          <PaymentOptionCard
            icon={Landmark}
            title="Manual Bank / Mobile Transfer"
            subtitle="Admin review within 24h"
            isSelected={option === "manual"}
            onClick={() => setOption("manual")}
          />
        </div>

        {/* Manual Account Details */}
        {option === "manual" && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-700 block">Transfer to Admin Account:</span>
            {paymentSettings?.bankName && (
              <div className="text-xs text-slate-600 flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                <span>{paymentSettings.bankName} - {paymentSettings.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy("bank", paymentSettings.accountNumber)}
                  className="text-emerald-600 font-semibold flex items-center gap-1"
                >
                  {copiedKey === "bank" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            <FormField
              label="Transaction ID / Reference Number"
              placeholder="e.g. TRX12345678"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              required
            />
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Upload Receipt</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs" required />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {option === "wallet" ? "Confirm & Pay Now" : "Submit Payment Proof"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
