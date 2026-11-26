import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Wallet,
  Edit2,
  RefreshCw,
} from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import StudentLayout from "../../components/layout/StudentLayout";
import {
  updateProfile,
  changeActiveRole,
} from "../../store/slices/authSlice";

export default function StudentProfile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || user?.phoneNumber || "",
    city: user?.city || "",
    country: user?.country || "",
    preferredLanguage: user?.preferredLanguage || "English",
    previousPassword: "",
    newPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await dispatch(updateProfile(formData));
    if (res.meta.requestStatus === "fulfilled") {
      setEditModalOpen(false);
    }
  };

  const handleSwitchToTeacher = async () => {
    if (
      window.confirm(
        "Do you want to switch your active role to Teacher?",
      )
    ) {
      const res = await dispatch(changeActiveRole("teacher"));
      if (res.meta.requestStatus === "fulfilled") {
        navigate("/teacher/dashboard");
      }
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            Student Profile
          </h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
        </div>

        <Card className="p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
            <img
              src={
                user?.picture ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
              }
              alt=""
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {user?.fullName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  Student
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-400 block uppercase">
                  Phone Number
                </span>
                <span className="font-semibold">
                  {user?.phone || user?.phoneNumber || "Not provided"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-400 block uppercase">
                  Location
                </span>
                <span className="font-semibold">
                  {user?.city || "City"}, {user?.country || "Country"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Globe className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-400 block uppercase">
                  Preferred Language
                </span>
                <span className="font-semibold">
                  {user?.preferredLanguage || "English"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Wallet className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-400 block uppercase">
                  Refund Wallet Balance
                </span>
                <span className="font-semibold text-blue-600">
                  {user?.studentWallet || 0} PKR
                </span>
              </div>
            </div>
          </div>

          {/* Switch Role Action */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">
                Want to teach on Dar-ul-Ameen?
              </p>
              <p className="text-[11px] text-slate-500">
                Switch your account to a teaching role and create your schedule.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSwitchToTeacher}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Switch to Teacher Role
            </Button>
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
            <Input
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Preferred Language
            </label>
            <select
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="English">English</option>
              <option value="Arabic">العربية (Arabic)</option>
              <option value="Urdu">اردو (Urdu)</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-xs font-semibold text-slate-700">
              Change Password (optional)
            </p>
            <Input
              label="Current Password"
              type="password"
              name="previousPassword"
              value={formData.previousPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <Input
              label="New Password"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </StudentLayout>
  );
}
