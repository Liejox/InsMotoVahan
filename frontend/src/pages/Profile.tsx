import React, { useRef, useState } from 'react';
import { Camera, Trash2, CheckCircle, AlertCircle, User, Mail, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserAvatar } from '../components/ui/UserAvatar';
import { RobotAvatar } from '../components/ui/RobotAvatar';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const Profile: React.FC = () => {
  const { user, avatarUrl, setAvatar } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('idle');
    setStatusMsg('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setStatusMsg('Please select an image file (JPG, PNG, GIF, WebP, etc.)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatus('error');
      setStatusMsg(`Image too large. Please choose a file under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!preview) return;
    setAvatar(preview);
    setPreview(null);
    setStatus('success');
    setStatusMsg('Profile picture updated successfully!');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
    setPreview(null);
    setStatus('success');
    setStatusMsg('Profile picture removed. Default avatar restored.');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleCancelPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayAvatar = preview ?? avatarUrl;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Profile Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account profile and profile picture
        </p>
      </div>

      {/* Profile Picture Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5">Profile Picture</h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Preview */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="relative">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Profile preview"
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-brand-500/20 shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-indigo-950/60 ring-4 ring-indigo-500/20 shadow-lg flex items-center justify-center">
                  <RobotAvatar size={100} />
                </div>
              )}
              {preview && (
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                  Preview
                </span>
              )}
            </div>

            {/* Current state label */}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {preview ? 'Unsaved preview' : avatarUrl ? 'Current photo' : 'Default avatar'}
            </span>
          </div>

          {/* Actions Panel */}
          <div className="flex-1 space-y-4 w-full">
            {/* Status message */}
            {status !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                status === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'
              }`}>
                {status === 'success'
                  ? <CheckCircle size={16} className="flex-shrink-0" />
                  : <AlertCircle size={16} className="flex-shrink-0" />
                }
                {statusMsg}
              </div>
            )}

            {/* Upload instruction */}
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p>Upload a profile photo to personalize your account.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Accepted: JPG, PNG, WebP, GIF &nbsp;•&nbsp; Max size: {MAX_FILE_SIZE_MB}MB
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="profile-photo-input"
            />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Choose photo */}
              <label
                htmlFor="profile-photo-input"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl cursor-pointer transition-colors shadow-sm shadow-brand-600/20"
              >
                <Camera size={16} />
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </label>

              {/* Save preview */}
              {preview && (
                <>
                  <button
                    onClick={handleSavePhoto}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer transition-colors"
                  >
                    <CheckCircle size={16} />
                    Save Photo
                  </button>
                  <button
                    onClick={handleCancelPreview}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Remove current photo */}
              {avatarUrl && !preview && (
                <button
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer transition-colors"
                >
                  <Trash2 size={16} />
                  Remove Photo
                </button>
              )}
            </div>

            {/* Note about storage */}
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              Your photo is stored locally in this browser. It will persist across sessions on this device.
            </p>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5">Account Information</h3>

        <div className="space-y-4">
          {/* Full Name */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex-shrink-0">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.fullName || '—'}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.email || '—'}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Shield size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                {user?.role?.toLowerCase() || 'agent'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Preview Strip */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Avatar Preview</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          How your avatar will appear across the application
        </p>
        <div className="flex items-end gap-6 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar size="xl" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Hero / Profile</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <UserAvatar size="lg" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Large</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <UserAvatar size="md" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sidebar</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <UserAvatar size="sm" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Navbar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
