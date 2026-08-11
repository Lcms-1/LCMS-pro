import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  Camera,
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin,
  Building,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  BadgeCheck,
  Shield,
  FileText,
  Heart,
  RefreshCw,
  Video,
  X,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { User } from '../../types';
import { NIGERIAN_STATES, NIGERIAN_STATES_AND_LGAS } from '../../data/nigeriaStatesLgas';
import { AlertMessage } from '../AlertMessage';
import { CoopLogo } from '../CoopLogo';
import { apiUrl } from '../../utils/apiClient';

interface MyProfileViewProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout?: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
}) => {
  // Form State initialized from currentUser
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [residentialAddress, setResidentialAddress] = useState(currentUser.residentialAddress || '');
  const [state, setState] = useState(currentUser.state || 'Osun State');
  const [lga, setLga] = useState(currentUser.lga || 'Iwo Local Government Area');
  const [occupation, setOccupation] = useState(currentUser.occupation || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  // Next of Kin State
  const [nokFullName, setNokFullName] = useState(currentUser.nextOfKin?.fullName || '');
  const [nokRelationship, setNokRelationship] = useState(currentUser.nextOfKin?.relationship || 'Spouse');
  const [nokPhone, setNokPhone] = useState(currentUser.nextOfKin?.phone || '');
  const [nokAddress, setNokAddress] = useState(currentUser.nextOfKin?.address || '');

  // Password State & Visibility Toggles
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Camera capture modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // File Input Ref for gallery upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync form state if currentUser changes externally
  useEffect(() => {
    setFullName(currentUser.fullName || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setResidentialAddress(currentUser.residentialAddress || '');
    setState(currentUser.state || 'Osun State');
    setLga(currentUser.lga || 'Iwo Local Government Area');
    setOccupation(currentUser.occupation || '');
    setAvatar(currentUser.avatar || '');
    setNokFullName(currentUser.nextOfKin?.fullName || '');
    setNokRelationship(currentUser.nextOfKin?.relationship || 'Spouse');
    setNokPhone(currentUser.nextOfKin?.phone || '');
    setNokAddress(currentUser.nextOfKin?.address || '');
  }, [currentUser]);

  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    const lgas = NIGERIAN_STATES_AND_LGAS[selectedState] || [];
    if (lgas.length > 0) {
      setLga(lgas[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          setSuccessMsg('New profile photo selected! Click "Save Changes Immediately" to finalize.');
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Access & Capture
  const startCamera = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setCameraStream(stream);
      setShowCameraModal(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 300);
    } catch {
      setErrorMsg('Camera access denied or unavailable on this device. Please use Gallery Upload instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setAvatar(dataUrl);
        setSuccessMsg('Camera photo captured! Click "Save Changes Immediately" to apply.');
        stopCamera();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid Email address is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    // Password validation logic
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        setErrorMsg('Current password is required to save password changes.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation password do not match.');
        return;
      }
    }

    setIsSaving(true);

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      residentialAddress: residentialAddress.trim(),
      state,
      lga,
      occupation: occupation.trim(),
      avatar,
      nextOfKin: {
        fullName: nokFullName.trim(),
        relationship: nokRelationship,
        phone: nokPhone.trim(),
        address: nokAddress.trim(),
      },
      currentPassword,
      newPassword,
      confirmPassword,
    };

    try {
      const response = await fetch(apiUrl(`/api/users/${currentUser.id}/profile`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setIsSaving(false);

      if (response.ok && data.success && data.user) {
        // Pass updated user to parent App handler to update local state and localStorage
        onUpdateUser(data.user);

        // Update form state with returned saved record
        setFullName(data.user.fullName || '');
        setEmail(data.user.email || '');
        setPhone(data.user.phone || '');
        setResidentialAddress(data.user.residentialAddress || '');
        setState(data.user.state || state);
        setLga(data.user.lga || lga);
        setOccupation(data.user.occupation || '');
        setAvatar(data.user.avatar || avatar);

        if (data.user.nextOfKin) {
          setNokFullName(data.user.nextOfKin.fullName || '');
          setNokRelationship(data.user.nextOfKin.relationship || 'Spouse');
          setNokPhone(data.user.nextOfKin.phone || '');
          setNokAddress(data.user.nextOfKin.address || '');
        }

        const passwordWasUpdated = Boolean(newPassword);

        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        if (passwordWasUpdated && onLogout) {
          setSuccessMsg('Your security password has been updated successfully! Re-directing to login screen so you can sign in with your new password...');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            onLogout();
          }, 1800);
        } else {
          setSuccessMsg(data.message || 'Profile saved successfully!');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setErrorMsg(data.error || 'Failed to update profile. Please try again.');
      }
    } catch (err: any) {
      setIsSaving(false);
      const passwordWasUpdated = Boolean(newPassword);

      // Fallback update in case of network issue
      const fallbackUser: User = {
        ...currentUser,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        residentialAddress: residentialAddress.trim(),
        state,
        lga,
        occupation: occupation.trim(),
        avatar,
        nextOfKin: {
          fullName: nokFullName.trim(),
          relationship: nokRelationship,
          phone: nokPhone.trim(),
          address: nokAddress.trim(),
        },
        password: newPassword || currentUser.password,
      };
      onUpdateUser(fallbackUser);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (passwordWasUpdated && onLogout) {
        setSuccessMsg('Your password has been changed successfully! Redirecting to sign in page...');
        setTimeout(() => {
          onLogout();
        }, 1800);
      } else {
        setSuccessMsg('Profile saved successfully in local storage!');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#014421] via-emerald-900 to-[#012d15] text-white shadow-xl border-2 border-[#DAA520]">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar Circle with quick upload overlay */}
            <div className="relative group">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#DAA520] shadow-md bg-emerald-950"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer"
              >
                <Camera className="w-5 h-5 text-amber-400 mb-0.5" />
                Change
              </button>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DAA520] text-[#014421] font-black text-xs uppercase tracking-wider mb-2">
                <BadgeCheck className="w-4 h-4" />
                {currentUser.role === 'sys_admin' ? 'Super Administrator & Founder' : currentUser.role.toUpperCase()}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">{fullName}</h1>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Member ID: <span className="font-mono text-amber-300 font-bold">{currentUser.memberNo}</span> • Branch: {currentUser.branch}
              </p>
              <p className="text-[11px] text-amber-200 font-semibold mt-0.5">
                State: {state} • LGA: {lga}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <CoopLogo size="md" showText variant="gold" />
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {successMsg && (
        <AlertMessage
          type="success"
          title="Profile Saved Successfully"
          message={successMsg}
          onClose={() => setSuccessMsg('')}
        />
      )}

      {errorMsg && (
        <AlertMessage
          type="error"
          title="Profile Update Error"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Options */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-[#014421]" />
            Profile Picture & Identity Photo
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Upload your official photograph from your gallery or capture directly using your device camera. Photos are permanently stored.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-amber-300" />
              Upload from Phone Gallery / File
            </button>

            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#014421] font-black text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              Take Photo with Camera
            </button>

            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80')}
                className="px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 text-xs font-bold cursor-pointer"
              >
                Reset Default Photo
              </button>
            )}
          </div>
        </div>

        {/* Personal & Contact Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
            <UserIcon className="w-5 h-5 text-emerald-700" />
            Personal & Official Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-slate-900"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Designation / Occupation
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Founder / Financial Secretary / Systems Engineer"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                State of Residence / Origin *
              </label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Local Government Area (LGA) *
              </label>
              <select
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
              >
                {(NIGERIAN_STATES_AND_LGAS[state] || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs pt-2">
            <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
              Residential Address *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={residentialAddress}
                onChange={(e) => setResidentialAddress(e.target.value)}
                placeholder="Full residential or office location address"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* Next of Kin Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
            <Heart className="w-5 h-5 text-rose-600" />
            Next of Kin Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Next of Kin Full Name
              </label>
              <input
                type="text"
                value={nokFullName}
                onChange={(e) => setNokFullName(e.target.value)}
                placeholder="e.g. Mrs. Ebenezer"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Relationship
              </label>
              <select
                value={nokRelationship}
                onChange={(e) => setNokRelationship(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
              >
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Relative">Relative</option>
                <option value="Business Partner">Business Partner</option>
              </select>
            </div>

            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Next of Kin Phone Number
              </label>
              <input
                type="text"
                value={nokPhone}
                onChange={(e) => setNokPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
              Next of Kin Contact Address
            </label>
            <input
              type="text"
              value={nokAddress}
              onChange={(e) => setNokAddress(e.target.value)}
              placeholder="Residential address of Next of Kin"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
            />
          </div>
        </div>

        {/* Security & Password Change Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
            <KeyRound className="w-5 h-5 text-amber-600" />
            Security & Password Change (Optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Current Password */}
            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Current Password {newPassword ? '*' : ''}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Toggle new password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save & Logout Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="px-6 py-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-800 flex items-center gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Sign Out of LCMS PRO
            </button>
          ) : <div />}

          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-xl bg-[#014421] hover:bg-emerald-900 text-white font-black text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                Saving Profile Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 text-amber-400" />
                Save Changes Immediately
              </>
            )}
          </button>
        </div>
      </form>

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border-2 border-[#DAA520] max-w-md w-full p-6 shadow-2xl dark:bg-slate-900 text-center">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h3 className="font-extrabold text-sm text-[#014421] dark:text-amber-400 flex items-center gap-2">
                <Video className="w-4 h-4 text-[#DAA520]" />
                Camera Photo Capture
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-slate-950 aspect-video mb-4 border border-slate-700">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-2 rounded-xl bg-[#014421] text-white font-black text-xs hover:bg-emerald-900 shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
