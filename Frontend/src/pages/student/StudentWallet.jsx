// Job: Student Wallet page composing WalletCard, top-up modal, transaction history, and top-up requests with real-time updates
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import WalletCard from "../../components/organisms/WalletCard";
import Modal from "../../components/organisms/Modal";
import FormField from "../../components/molecules/FormField";
import Button from "../../components/atoms/Button";
import PriceText from "../../components/atoms/PriceText";
import DateText from "../../components/atoms/DateText";
import StatusBadge from "../../components/atoms/StatusBadge";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import { compressImage } from "../../utils/imageCompressor";
import {
  fetchStudentWallet,
  requestWalletTopup,
  fetchPaymentSettings,
} from "../../store/slices/studentSlice";
import { getSocket } from "../../services/socket.service";

export default function StudentWallet() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { wallet, paymentSettings, isLoading } = useSelector(
    (state) => state.student
  );

  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("JazzCash");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");

  useEffect(() => {
    dispatch(fetchStudentWallet());
    dispatch(fetchPaymentSettings());
  }, [dispatch]);

  // Real-time socket listener for student wallet
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleWalletUpdate = () => {
      dispatch(fetchStudentWallet());
    };
    socket.on("walletUpdated", handleWalletUpdate);
    return () => {
      socket.off("walletUpdated", handleWalletUpdate);
    };
  }, [dispatch]);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("File size must be under 10MB");
      return;
    }
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.75,
      });
      setScreenshot(compressed);
      setScreenshotPreview(compressed);
      setSubmitError("");
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshot(reader.result);
        setScreenshotPreview(reader.result);
        setSubmitError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!amount || Number(amount) <= 0) {
      setSubmitError("Please enter a valid amount");
      return;
    }
    if (!transactionId.trim()) {
      setSubmitError("Please enter the Transaction ID / Reference number");
      return;
    }
    if (!screenshot) {
      setSubmitError("Please upload payment proof screenshot");
      return;
    }

    setSubmitting(true);
    const res = await dispatch(
      requestWalletTopup({
        amount: Number(amount),
        paymentMethod,
        transactionId: transactionId.trim(),
        screenshot,
      })
    );
    setSubmitting(false);

    if (res.meta.requestStatus === "fulfilled") {
      setTopupModalOpen(false);
      setAmount("");
      setTransactionId("");
      setScreenshot("");
      setScreenshotPreview("");
      dispatch(fetchStudentWallet());
      setActiveTab("topups");
    } else {
      setSubmitError(res.payload || "Failed to submit topup request");
    }
  };

  const balance = wallet?.balance ?? 0;
  const transactions = wallet?.transactions || [];
  const topups = wallet?.topups || [];

  return (
    <StudentLayout
      title="My Student Wallet"
      subtitle="Manage your balance, add funds via JazzCash / Easypaisa, and pay for bookings seamlessly"
    >
      <div className="space-y-6">
        {/* Wallet Overview Component */}
        <WalletCard
          balance={balance}
          totalCredited={wallet?.totalCredited || 0}
          totalSpent={wallet?.totalSpent || 0}
          pending={wallet?.pendingBalance || 0}
          onTopUp={() => {
            setSubmitError("");
            setTopupModalOpen(true);
          }}
        />

        {/* Quick Tabs: Transactions vs Top-Up Requests */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "transactions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Transaction History ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("topups")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "topups"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Top-up Requests ({topups.length})
          </button>
        </div>

        {/* TAB 1: Transactions Table */}
        {activeTab === "transactions" && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            {transactions.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No transactions yet"
                description="When you add funds or pay for classes, your transaction record will appear here."
                className="py-12"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => {
                      const isExpense = tx.type === "booking_payment";
                      return (
                        <tr key={tx._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            <DateText date={tx.createdAt} />
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-semibold capitalize text-slate-700">
                              {isExpense ? (
                                <>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                                  Class Payment
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                                  {tx.type === "refund" ? "Refund" : "Top-Up"}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {tx.description || "Wallet transaction"}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-bold">
                            <span className={isExpense ? "text-rose-600" : "text-emerald-600"}>
                              {isExpense ? "-" : "+"} <PriceText amount={Math.abs(tx.amount)} />
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={tx.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Top-Up Requests */}
        {activeTab === "topups" && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Your Top-Up Submissions</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSubmitError("");
                  setTopupModalOpen(true);
                }}
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                New Top-Up Request
              </Button>
            </div>

            {topups.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No Top-up Requests"
                description="You haven't submitted any top-up requests yet."
                className="py-12"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topups.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {req.paymentMethod}
                        </span>
                        <PriceText amount={req.amount} size="lg" className="text-slate-900 font-bold" />
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <p className="truncate">
                        TxID: <strong className="font-mono text-slate-800">{req.transactionId}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Submitted: <DateText date={req.createdAt} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Topup Modal */}
      <Modal
        isOpen={topupModalOpen}
        onClose={() => setTopupModalOpen(false)}
        title="Top Up Student Wallet"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleTopupSubmit} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Account Details Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Transfer to Admin:</span>
            {paymentSettings?.bankName && (
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                <span>{paymentSettings.bankName} - {paymentSettings.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentSettings.accountNumber, "bank")}
                  className="text-emerald-600 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "bank" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <FormField
            label="Amount (PKR)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 5000"
            required
          />

          <FormField
            label="Transaction ID / Reference Number"
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. 0938217392"
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {screenshotPreview && (
              <img src={screenshotPreview} alt="Proof" className="w-16 h-16 object-cover rounded-lg border border-slate-300 mt-2" />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button size="md" variant="outline" type="button" onClick={() => setTopupModalOpen(false)}>
              Cancel
            </Button>
            <Button size="md" variant="primary" type="submit" isLoading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </StudentLayout>
  );
}
