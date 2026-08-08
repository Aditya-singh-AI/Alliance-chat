import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaUser, FaPlus, FaAngleDown, FaEnvelope, FaPhone } from 'react-icons/fa';
import { IoChatbubblesSharp } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import { useLoginStore } from '../../store/useLoginStore';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { sendOTP, verifyOTP, updateUserProfile } from '../../services/user.service';
import { countries } from '../../utils/country';
import Spinner from '../../utils/Spinner';

// ── Validation Schemas ──────────────────────────────────────────────────────
const loginSchema = yup.object().shape({
  phoneNumber: yup.string().nullable().notRequired()
    .test('digits', 'Phone must be digits only', (v) => !v || /^\d+$/.test(v)),
  email: yup.string().nullable().notRequired().email('Invalid email format'),
}).test('at-least-one', 'Phone number or email is required', (v) => !!(v.phoneNumber || v.email));

const otpSchema = yup.object().shape({
  otp: yup.string().required('OTP is required').length(6, 'OTP must be 6 digits'),
});

const profileSchema = yup.object().shape({
  username: yup.string().required('Username is required').min(2, 'Min 2 characters'),
  agreed: yup.boolean().oneOf([true], 'You must agree to Terms & Conditions'),
});

// ── Main Component ─────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } = useLoginStore();

  const isDark = theme === 'dark';

  // Local states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const avatarSeeds = ['Felix', 'Aria', 'Mia', 'Zoe', 'Leo'];

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.dialCode.includes(searchTerm)
  );

  // ── Form hooks ─────────────────────────────────────────────────────────
  const { formState: { errors: errLogin } } =
    useForm({ resolver: yupResolver(loginSchema) });

  const { handleSubmit: submitOtp, setValue: setOtpVal, formState: { errors: errOtp } } =
    useForm({ resolver: yupResolver(otpSchema) });

  const { register: regProfile, handleSubmit: submitProfile, watch: watchProfile, formState: { errors: errProfile } } =
    useForm({ resolver: yupResolver(profileSchema) });

  const agreedWatched = watchProfile('agreed');

  // ── Handlers ───────────────────────────────────────────────────────────
  const onLoginSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber && !email) {
      setGeneralError('Phone number or email is required');
      toast.error('Phone number or email is required');
      return;
    }
    setLoading(true); setGeneralError('');
    try {
      const res = await sendOTP(
        phoneNumber ? selectedCountry.dialCode : null,
        phoneNumber || null,
        email || null
      );
      if (res.status === 'success') {
        toast.info(res.message || 'Verification code sent!');
        const fallbackOtp = res.data?.devOtp || (res.message ? res.message.match(/\d{6}/)?.[0] : null);
        setUserPhoneData({ phoneNumber, phoneSuffix: selectedCountry.dialCode, email, fallbackOtp });
        setStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
      setGeneralError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const onOTPSubmit = async () => {
    setLoading(true); setGeneralError('');
    const otpString = otp.join('');
    try {
      const res = await verifyOTP(
        userPhoneData?.phoneNumber || null,
        userPhoneData?.phoneSuffix || null,
        userPhoneData?.email || null,
        otpString
      );
      // Backend may return { status:'success', data } OR { message, user, token }
      const user = res.data?.user || res.user;
      if (res.status === 'success' || user) {
        toast.success('OTP verified!');
        if (user?.username && user?.profilePicture) {
          setUser(user); toast.success(`Welcome back, ${user.username}!`);
          navigate('/'); resetLoginState();
        } else { setStep(3); }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      setGeneralError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const onProfileSubmit = async (data) => {
    setLoading(true); setGeneralError('');
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('agreed', data.agreed);
    if (profilePictureFile) {
      formData.append('media', profilePictureFile);
    } else {
      formData.append('profilePicture', selectedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`);
    }
    try {
      const res = await updateUserProfile(formData);
      if (res.status === 'success') {
        setUser(res.data); toast.success('Profile created!');
        navigate('/'); resetLoginState();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Profile update failed';
      setGeneralError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleOTPChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpVal('otp', newOtp.join(''), { shouldValidate: true });
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setSelectedAvatar(null);
    }
  };

  const handleBack = () => { setStep(1); setOtp(['', '', '', '', '', '']); setGeneralError(''); };

  // ── Progress bar ───────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div className={`w-full rounded-full h-1 mb-8 overflow-hidden ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`}>
      <motion.div
        className="h-1 rounded-full bg-[#00a884]"
        animate={{ width: `${(step / 3) * 100}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </div>
  );

  const inputClass = (hasError) =>
    `w-full p-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-[#00a884]/40 focus:border-[#00a884] ${hasError ? 'border-red-500' : isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef] placeholder-[#8696a0]' : 'bg-[#f0f2f5] border-gray-200 text-gray-800 placeholder-gray-500'}`;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 overflow-hidden relative ${isDark ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
      {/* Subtle background accent glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[480px] h-[480px] bg-[#00a884] rounded-full opacity-[0.04] blur-[100px]" />
        <div className="absolute -bottom-60 -left-60 w-[480px] h-[480px] bg-[#00a884] rounded-full opacity-[0.03] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 border ${isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-800'}`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-14 h-14 bg-[#00a884] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00a884]/20 mb-3"
          >
            <IoChatbubblesSharp className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#00a884]">Talkative</h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
            {step === 1 ? 'Sign in to continue' : step === 2 ? 'Verify your identity' : 'Complete your profile'}
          </p>
        </div>

        <ProgressBar />

        {generalError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mb-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20"
          >
            {generalError}
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Phone / Email ──────────────────────────────────── */}
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={onLoginSubmit}
              className="space-y-4"
            >
              <p className={`text-sm text-center mb-4 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                Enter your phone or email to receive a verification code
              </p>

              {/* Country + Phone row */}
              <div className="flex gap-2 relative">
                <button
                  id="country-selector"
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-1 p-3 rounded-xl border text-sm font-medium w-1/3 transition-colors ${isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942]' : 'bg-[#f0f2f5] border-gray-200 hover:bg-gray-200'}`}
                >
                  <span>{selectedCountry.flag}</span>
                  <span className="text-xs">{selectedCountry.dialCode}</span>
                  <FaAngleDown className="ml-auto text-xs opacity-60" />
                </button>

                {showDropdown && (
                  <div className={`absolute left-0 top-14 w-full z-50 rounded-xl border shadow-2xl max-h-56 overflow-y-auto ${isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-white border-gray-200'}`}>
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full p-2.5 text-sm border-b outline-none sticky top-0 ${isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef] placeholder-[#8696a0]' : 'bg-white border-gray-200'}`}
                    />
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setSelectedCountry(c); setShowDropdown(false); setSearchTerm(''); }}
                        className={`w-full text-left p-3 text-sm flex gap-3 items-center transition-colors ${isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                      >
                        <span>{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                        <span className={`ml-auto text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`}>{c.dialCode}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 relative">
                  <FaPhone className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                  <input
                    id="phone-input"
                    type="text"
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`${inputClass(errLogin.phoneNumber)} pl-8`}
                  />
                </div>
              </div>
              {errLogin.phoneNumber && <p className="text-red-400 text-xs">{errLogin.phoneNumber.message}</p>}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className={`flex-1 h-px ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`} />
                <span className={`text-xs font-medium ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`}>OR</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`} />
              </div>

              {/* Email input */}
              <div className="relative">
                <FaEnvelope className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                <input
                  id="email-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass(errLogin.email)} pl-10`}
                />
              </div>
              {errLogin.email && <p className="text-red-400 text-xs">{errLogin.email.message}</p>}
              {errLogin['at-least-one'] && <p className="text-red-400 text-xs">{errLogin['at-least-one'].message}</p>}

              <button
                id="send-otp-btn"
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#00a884]/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : 'Send Verification Code'}
              </button>
            </motion.form>
          )}

          {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={submitOtp(onOTPSubmit)}
              className="space-y-5"
            >
              <p className={`text-sm text-center ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                Enter the 6-digit code sent to your {userPhoneData?.email ? 'email' : 'phone'}
              </p>

              {userPhoneData?.fallbackOtp && (
                <div className={`p-3 rounded-xl text-center border ${isDark ? 'bg-[#00a884]/10 border-[#00a884]/20' : 'bg-[#00a884]/5 border-[#00a884]/15'}`}>
                  <p className="text-xs text-[#00a884] font-semibold mb-1">Verification Code:</p>
                  <span className="text-2xl font-extrabold tracking-widest text-[#00a884] font-mono">
                    {userPhoneData.fallbackOtp}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(idx, e)}
                    className={`w-12 h-12 text-center rounded-xl border outline-none text-lg font-bold focus:ring-2 focus:ring-[#00a884]/40 focus:border-[#00a884] transition-all ${errOtp.otp ? 'border-red-500' : isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-[#f0f2f5] border-gray-200'}`}
                  />
                ))}
              </div>
              {errOtp.otp && <p className="text-red-400 text-xs text-center">{errOtp.otp.message}</p>}

              <button
                id="verify-otp-btn"
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#00a884]/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className={`w-full p-2 flex items-center justify-center gap-2 text-sm transition-colors ${isDark ? 'text-[#8696a0] hover:text-[#e9edef]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FaArrowLeft className="text-xs" /> Wrong contact? Go back
              </button>
            </motion.form>
          )}

          {/* ── STEP 3: Profile Setup ──────────────────────────────────── */}
          {step === 3 && (
            <motion.form
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={submitProfile(onProfileSubmit)}
              className="space-y-4"
            >
              {/* Avatar preview */}
              <div className="flex flex-col items-center mb-2">
                <div className="relative w-24 h-24 rounded-full border-[3px] border-[#00a884] overflow-hidden shadow-lg shadow-[#00a884]/10 mb-2">
                  <img
                    src={profilePicturePreview || selectedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <label htmlFor="file-upload" className="absolute bottom-0 right-0 bg-[#00a884] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#008f6f] transition-colors">
                    <FaPlus className="w-3 h-3" />
                  </label>
                  <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <span className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>Upload photo or pick an avatar</span>
              </div>

              {/* Avatar presets */}
              <div className="flex justify-center gap-3 overflow-x-auto pb-1">
                {avatarSeeds.map((seed, idx) => {
                  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                  const isSelected = selectedAvatar === url && !profilePicturePreview;
                  return (
                    <motion.img
                      key={idx}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      src={url}
                      alt={`Avatar ${idx}`}
                      onClick={() => { setSelectedAvatar(url); setProfilePictureFile(null); setProfilePicturePreview(null); }}
                      className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all ${isSelected ? 'border-[#00a884] shadow-md shadow-[#00a884]/20' : isDark ? 'border-[#202c33]' : 'border-gray-200'}`}
                    />
                  );
                })}
              </div>

              {/* Username */}
              <div className="relative">
                <FaUser className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                <input
                  id="username-input"
                  type="text"
                  placeholder="Choose a username"
                  {...regProfile('username')}
                  className={`${inputClass(errProfile.username)} pl-10`}
                />
              </div>
              {errProfile.username && <p className="text-red-400 text-xs">{errProfile.username.message}</p>}

              {/* Terms checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="agreed-checkbox"
                  type="checkbox"
                  {...regProfile('agreed')}
                  className="rounded text-[#00a884] focus:ring-[#00a884] w-4 h-4 accent-[#00a884]"
                />
                <span className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                  I agree to the{' '}
                  <span className="text-[#00a884] cursor-pointer hover:underline">Terms & Conditions</span>
                </span>
              </label>
              {errProfile.agreed && <p className="text-red-400 text-xs">{errProfile.agreed.message}</p>}

              <button
                id="create-account-btn"
                type="submit"
                disabled={loading || !agreedWatched}
                className={`w-full p-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${loading || !agreedWatched ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#00a884] hover:bg-[#008f6f] shadow-[#00a884]/15'}`}
              >
                {loading ? <Spinner /> : 'Create Account'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
