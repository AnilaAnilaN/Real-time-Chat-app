import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const { authUser, closeAccount } = useAuthStore();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCloseAccount = async () => {
    try {
      await closeAccount(authUser._id);
      toast.success("Account closed successfully");
      navigate("/login");
    } catch (error) {
      console.error("[SettingsPage] Close account error:", error);
      toast.error("Failed to close account");
    }
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl bg-base-100">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-white">Account Settings</h2>
          <p className="text-sm text-base-content/70">Manage your account preferences</p>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="size-6 text-error" />
            <h3 className="text-lg font-semibold text-black">Close Account</h3>
          </div>
          <p className="text-sm text-base-content/70 mb-4">
            Closing your account is permanent and cannot be undone. All your messages, media, and profile data will be deleted.
          </p>
          <button
            className="btn btn-error btn-sm text-white hover:bg-error-focus"
            onClick={() => setShowConfirmModal(true)}
          >
            Close Account
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-200 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="size-6 text-error" />
                <h3 className="text-lg font-semibold text-black">Confirm Account Closure</h3>
              </div>
              <p className="text-sm text-base-content/70 mb-6">
                Are you sure you want to close your account? This action is irreversible.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-sm btn-outline border-base-300 text-white hover:bg-base-300"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-error text-white hover:bg-error-focus"
                  onClick={handleCloseAccount}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;