import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Sliders, Save, CheckCircle2 } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingState from "../../components/common/LoadingState";
import ErrorState from "../../components/common/ErrorState";
import {
  fetchSettings,
  updateCommissionSettings,
} from "../../store/slices/adminSlice";

export default function AdminSettings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { settings, isLoading, isError, message } = useSelector(
    (state) => state.admin,
  );

  const [commissionPercentage, setCommissionPercentage] = useState(20);
  const [platformName, setPlatformName] = useState(
    "Dar-ul-Ameen Tutor Platform",
  );
  const [minWithdrawal, setMinWithdrawal] = useState(500);

  // Pakistan Payment Credentials
  const [jazzcashNumber, setJazzcashNumber] = useState("03001234567");
  const [jazzcashTitle, setJazzcashTitle] = useState("Dar-ul-Ameen Official");
  const [easypaisaNumber, setEasypaisaNumber] = useState("03451234567");
  const [easypaisaTitle, setEasypaisaTitle] = useState("Dar-ul-Ameen Official");
  const [bankName, setBankName] = useState("Meezan Bank");
  const [bankAccountNumber, setBankAccountNumber] = useState("01020304050607");
  const [bankAccountTitle, setBankAccountTitle] = useState("Dar-ul-Ameen");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      if (settings.commissionPercentage !== undefined)
        setCommissionPercentage(settings.commissionPercentage);
      if (settings.platformName) setPlatformName(settings.platformName);
      if (settings.minWithdrawal) setMinWithdrawal(settings.minWithdrawal);
      if (settings.jazzcashNumber) setJazzcashNumber(settings.jazzcashNumber);
      if (settings.jazzcashTitle) setJazzcashTitle(settings.jazzcashTitle);
      if (settings.easypaisaNumber) setEasypaisaNumber(settings.easypaisaNumber);
      if (settings.easypaisaTitle) setEasypaisaTitle(settings.easypaisaTitle);
      if (settings.bankName) setBankName(settings.bankName);
      if (settings.bankAccountNumber) setBankAccountNumber(settings.bankAccountNumber);
      if (settings.bankAccountTitle) setBankAccountTitle(settings.bankAccountTitle);
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSavedSuccess(false);
    setIsSaving(true);
    const res = await dispatch(
      updateCommissionSettings({
        commissionPercentage: Number(commissionPercentage),
        platformName,
        minWithdrawal: Number(minWithdrawal),
        jazzcashNumber,
        jazzcashTitle,
        easypaisaNumber,
        easypaisaTitle,
        bankName,
        bankAccountNumber,
        bankAccountTitle,
      }),
    );
    setIsSaving(false);
    if (res.meta.requestStatus === "fulfilled") {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  return (
    <AdminLayout
      title={t("admin.settingsTitle")}
      subtitle="Manage global platform commission fees, payment accounts for wallet top-ups, and payout thresholds"
    >
      <div className="max-w-3xl space-y-6">
        {isLoading && !settings ? (
          <LoadingState message="Loading platform settings..." />
        ) : isError ? (
          <ErrorState
            message={message}
            onRetry={() => dispatch(fetchSettings())}
          />
        ) : (
          <Card className="p-8">
            {savedSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Settings updated successfully! Changes apply immediately.
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Platform General Config */}
              <div className="border-b border-slate-200 pb-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  General Platform Settings
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Platform Name *
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Commission Percentage (%) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Minimum Teacher Withdrawal (PKR) *
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={minWithdrawal}
                      onChange={(e) => setMinWithdrawal(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Official Payment Accounts (Shown to Students for Wallet Topup & Direct Payment) */}
              <div className="space-y-4 pt-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Student Wallet & Payment Deposit Accounts (Pakistan Standard)
                </h3>
                <p className="text-xs text-slate-500">
                  These account numbers and titles are shown to students in the
                  Wallet Top-up and Direct Booking payment modals.
                </p>

                {/* JazzCash Settings */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <span className="font-bold text-amber-900 text-xs uppercase block">
                    JazzCash Account Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        JazzCash Mobile Number
                      </label>
                      <input
                        type="text"
                        value={jazzcashNumber}
                        onChange={(e) => setJazzcashNumber(e.target.value)}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        JazzCash Account Title
                      </label>
                      <input
                        type="text"
                        value={jazzcashTitle}
                        onChange={(e) => setJazzcashTitle(e.target.value)}
                        placeholder="Dar-ul-Ameen Official"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Easypaisa Settings */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                  <span className="font-bold text-emerald-900 text-xs uppercase block">
                    Easypaisa Account Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Easypaisa Mobile Number
                      </label>
                      <input
                        type="text"
                        value={easypaisaNumber}
                        onChange={(e) => setEasypaisaNumber(e.target.value)}
                        placeholder="03451234567"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Easypaisa Account Title
                      </label>
                      <input
                        type="text"
                        value={easypaisaTitle}
                        onChange={(e) => setEasypaisaTitle(e.target.value)}
                        placeholder="Dar-ul-Ameen Official"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Account Settings */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                  <span className="font-bold text-blue-900 text-xs uppercase block">
                    Bank Account Details (Optional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Meezan Bank"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Account / IBAN Number
                      </label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="01020304050607"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        value={bankAccountTitle}
                        onChange={(e) => setBankAccountTitle(e.target.value)}
                        placeholder="Dar-ul-Ameen"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Platform Settings"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
