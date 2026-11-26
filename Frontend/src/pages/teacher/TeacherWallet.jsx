// Job: Teacher Wallet page composing WalletCard, withdrawal request modal, ledger history, and pending approval banner
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  ArrowDownToLine,
  Lock,
  Clock,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import TeacherLayout from "../../components/layout/TeacherLayout";
import WalletCard from "../../components/organisms/WalletCard";
import Modal from "../../components/organisms/Modal";
import FormField from "../../components/molecules/FormField";
import Button from "../../components/atoms/Button";
import PriceText from "../../components/atoms/PriceText";
import DateText from "../../components/atoms/DateText";
import StatusBadge from "../../components/atoms/StatusBadge";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import {
  fetchTeacherWallet,
  requestWithdrawal,
} from "../../store/slices/teacherSlice";
import { getSocket } from "../../services/socket.service";

export default function TeacherWallet() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const {
    wallet,
    isPendingApproval,
    pendingApprovalMessage,
    isLoading,
  } = useSelector((state) => state.teacher);

  const balance = Number(wallet?.balance) || 0;
  const pendingBalance = Number(wallet?.pendingBalance) || 0;
  const totalWithdrawn = Number(wallet?.totalWithdrawn) || 0;
  const totalEarned = Number(wallet?.totalEarned) || balance + totalWithdrawn;
  const minWithdrawal = Number(wallet?.minWithdrawal) || 500;
  const commissionPercentage = Number(wallet?.commissionPercentage) || 20;
  const withdrawals = Array.isArray(wallet?.withdrawals) ? wallet.withdrawals : [];
  const ledger = Array.isArray(wallet?.ledger) ? wallet.ledger : [];

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState(minWithdrawal);
  const [accountDetails, setAccountDetails] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("ledger"); // "ledger" | "withdrawals"

  useEffect(() => {
    dispatch(fetchTeacherWallet());
  }, [dispatch]);

  // Real-time socket listener for teacher wallet
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleWalletUpdate = () => {
      dispatch(fetchTeacherWallet());
    };
    socket.on("walletUpdated", handleWalletUpdate);
    return () => {
      socket.off("walletUpdated", handleWalletUpdate);
    };
  }, [dispatch]);

  useEffect(() => {
    if (wallet?.minWithdrawal) {
      setAmount((prev) => Math.max(prev, wallet.minWithdrawal));
    }
  }, [wallet?.minWithdrawal]);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError("");

    if (amount < minWithdrawal) {
      setWithdrawError(
        `Minimum withdrawal amount is ${minWithdrawal} PKR per System Preferences`
      );
      return;
    }
    if (amount > balance) {
      setWithdrawError("Insufficient available balance");
      return;
    }
    if (!accountDetails.trim()) {
      setWithdrawError("Please provide your bank or payment details");
      return;
    }

    setIsSubmitting(true);
    const res = await dispatch(
      requestWithdrawal({ amount: Number(amount), accountDetails })
    );
    setIsSubmitting(false);

    if (res.meta.requestStatus === "fulfilled") {
      setWithdrawModalOpen(false);
      setAccountDetails("");
      dispatch(fetchTeacherWallet());
      setActiveTab("withdrawals");
    } else {
      setWithdrawError(res.payload || "Withdrawal request failed");
    }
  };

  return (
    <TeacherLayout
      title={t("teacher.walletTitle") || "Earnings & Wallet"}
      subtitle="View your lesson revenues, track commission splits, and request payouts"
    >
      <div className="space-y-6">
        {/* Pending Approval Warning */}
        {isPendingApproval && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold">
              {pendingApprovalMessage ||
                "Your teacher profile is under admin verification. Withdrawals will unlock once approved."}
            </p>
          </div>
        )}

        {/* Primary Wallet Card */}
        <WalletCard
          balance={balance}
          totalCredited={totalEarned}
          totalSpent={totalWithdrawn}
          pending={pendingBalance}
          isTeacher={true}
          onWithdraw={() => {
            setWithdrawError("");
            setWithdrawModalOpen(true);
          }}
        />

        {/* Commission Policy Card */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Platform Commission Policy: </span>
              <span>{commissionPercentage}% platform share, <strong>{100 - commissionPercentage}% teacher earnings</strong>.</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
            Min. Payout: Rs. {minWithdrawal}
          </span>
        </div>

        {/* Quick Tabs: Ledger History vs Payout Requests */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "ledger"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Earnings Ledger ({ledger.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("withdrawals")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "withdrawals"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Withdrawal History ({withdrawals.length})
          </button>
        </div>

        {/* TAB 1: Ledger Table */}
        {activeTab === "ledger" && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            {ledger.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No earnings recorded yet"
                description="Complete student classes to generate earning ledger entries."
                className="py-12"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3">Gross</th>
                      <th className="py-3 px-3">Commission</th>
                      <th className="py-3 px-3">Net Earning</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          <DateText date={item.createdAt} />
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {item.description || "Class session completed"}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">
                          <PriceText amount={item.grossAmount || item.amount || 0} />
                        </td>
                        <td className="py-3 px-3 text-rose-600 font-mono">
                          -{item.commissionAmount || 0} PKR
                        </td>
                        <td className="py-3 px-3 text-emerald-600 font-bold font-mono">
                          +<PriceText amount={item.netAmount || item.amount || 0} />
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={item.status || "available"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Withdrawals Table */}
        {activeTab === "withdrawals" && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            {withdrawals.length === 0 ? (
              <EmptyState
                icon={ArrowDownToLine}
                title="No withdrawal requests yet"
                description="Withdraw funds when your balance reaches the minimum threshold."
                className="py-12"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {withdrawals.map((w) => (
                  <div
                    key={w._id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Payout Request
                        </span>
                        <PriceText amount={w.amount} size="lg" className="text-slate-900 font-bold" />
                      </div>
                      <StatusBadge status={w.status} />
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                      <p className="truncate">
                        Account: <strong>{w.accountDetails}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Date: <DateText date={w.createdAt} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payout / Withdrawal Request Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Request Payout Withdrawal"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          {withdrawError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">Available to Withdraw:</span>
            <PriceText amount={balance} size="md" className="font-bold text-emerald-700" />
          </div>

          <FormField
            label={`Withdrawal Amount (Min. ${minWithdrawal} PKR)`}
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={minWithdrawal}
            max={balance}
            required
          />

          <FormField
            label="Payment Details (Bank Name, Account Title & IBAN / JazzCash / Easypaisa)"
            type="text"
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            placeholder="e.g. JazzCash - 03001234567 - Muhammad Ali"
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="md"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={balance < minWithdrawal}
            >
              Submit Payout Request
            </Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}
