import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import TeacherLayout from "../../components/layout/TeacherLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import { updateProfile } from "../../store/slices/authSlice";

export default function TeacherProfile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || user?.phoneNumber || "",
    city: user?.city || "",
    country: user?.country || "",
    bio: user?.bio || "",
    picture: user?.picture || "",
    preferredLanguage: user?.preferredLanguage || "English",
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

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("teacher.profileTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your personal and public tutor profile details
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            {t("teacher.editProfile")}
          </Button>
        </div>

        {/* Notice on Profile Edit vs Schedule Edit */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3 text-xs text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong className="font-semibold">Note:</strong> Editing your basic info (Bio, Photo, Phone, City) does <em>NOT</em> require Admin re-approval. Changing your Schedule in Schedule Edit <em>DOES</em> require Admin re-approval.
          </span>
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
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    user?.teachingStatus === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {user?.teachingStatus || "pending"}
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
          </div>

          {/* Bio Display */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              {t("teacher.bioLabel")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {user?.bio ||
                "No bio provided yet. Add an engaging bio to attract more students to your classes."}
            </p>
          </div>
        </Card>
      </div>

      {/* Edit Basic Info Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t("teacher.editProfile")}
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

          <Input
            label="Profile Picture URL"
            name="picture"
            value={formData.picture}
            onChange={handleChange}
            placeholder="https://..."
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Bio / Introduction
            </label>
            <textarea
              rows={4}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell students about your qualifications and teaching style..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}
