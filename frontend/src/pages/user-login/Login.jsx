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

  const { formState: { errors: errLogin } } = useForm({ resolver: yupResolver(loginSchema) });
  const { handleSubmit: submitOtp, setValue: setOtpVal, formState: { errors: errOtp } } = useForm({ resolver: yupResolver(otpSchema) });
  const { register: regProfile, handleSubmit: submitProfile, watch: watchProfile, formState: { errors: errProfile } } = useForm({ resolver: yupResolver(profileSchema) });
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
      const res = await sendOTP(phoneNumber ? selectedCountry.dialCode : null, phoneNumber || null, email || null);
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
      const res = await verifyOTP(userPhoneData?.phoneNumber || null, userPhoneData?.phoneSuffix || null, userPhoneData?.email || null, otpString);
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
    if (e.key === 'Backspace' && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setProfilePictureFile(file); setProfilePicturePreview(URL.createObjectURL(file)); setSelectedAvatar(null); }
  };

  const handleBack = () => { setStep(1); setOtp(['', '', '', '', '', '']); setGeneralError(''); };

  // ── Step indicator dots ──
  const StepDots = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <motion.div
          key={s}
          animate={{ scale: step === s ? 1 : 0.75, opacity: step === s ? 1 : 0.3 }}
          className={`rounded-full transition-all duration-300 ${step === s ? 'w-8 h-2 accent-gradient' : `w-2 h-2 ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`}`}
        />
      ))}
    </div>
  );

  const inputCls = (hasErr) =>
    `w-full px-4 py-3.5 rounded-2xl border-2 outline-none transition-all duration-200 text-sm font-medium ${hasErr
      ? 'border-red-500/60 focus:border-red-500'
      : isDark
        ? 'bg-[#18181B] border-[#27272A] text-[#FAFAFA] placeholder-[#71717A] focus:border-[#F97316] focus:bg-[#1C1C20]'
        : 'bg-[#F5F5F4] border-[#E7E5E4] text-[#0C0A09] placeholder-[#A8A29E] focus:border-[#F97316] focus:bg-white'
    }`;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-[#FAFAF9]'}`}>
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] bg-[#F97316]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04] blur-[100px] bg-[#FBBF24]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-[420px] relative z-10`}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full accent-gradient rounded-t-3xl" />

        <div className={`px-8 pt-8 pb-10 rounded-b-3xl border border-t-0 shadow-2xl ${isDark
          ? 'bg-[#18181B]/90 border-[#27272A] shadow-black/40 backdrop-blur-xl'
          : 'bg-white/95 border-[#E7E5E4] shadow-stone-200/60 backdrop-blur-xl'
        }`}>
          {/* Brand */}
          <div className="flex flex-col items-center mb-2">
            <motion.div
              animate={{ rotate: [0, 2, -2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4"
            >
              <IoChatbubblesSharp className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-xl font-extrabold tracking-tight accent-gradient-text mb-1">Talkative</h1>
            <p className={`text-xs font-medium ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
              {step === 1 ? 'Sign in to your account' : step === 2 ? 'Enter verification code' : 'Set up your profile'}
            </p>
          </div>

          <StepDots />

          {generalError && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className={`text-sm text-center mb-5 px-4 py-3 rounded-2xl border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}
            >
              {generalError}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* ══════ STEP 1 ══════ */}
            {step === 1 && (
              <motion.form key="s1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }} onSubmit={onLoginSubmit} className="space-y-4">
                {/* Phone row */}
                <div className="flex gap-2 relative">
                  <button id="country-selector" type="button" onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center gap-1.5 px-3 py-3.5 rounded-2xl border-2 text-sm font-semibold w-[100px] flex-shrink-0 transition-all ${isDark ? 'bg-[#18181B] border-[#27272A] text-[#FAFAFA] hover:border-[#3F3F46]' : 'bg-[#F5F5F4] border-[#E7E5E4] hover:border-[#D6D3D1]'}`}
                  >
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span className="text-xs">{selectedCountry.dialCode}</span>
                    <FaAngleDown className="ml-auto text-[10px] opacity-50" />
                  </button>

                  {showDropdown && (
                    <div className={`absolute left-0 top-[56px] w-full z-50 rounded-2xl border-2 shadow-2xl max-h-56 overflow-y-auto ${isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-[#E7E5E4]'}`}>
                      <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full p-3 text-sm border-b outline-none sticky top-0 ${isDark ? 'bg-[#18181B] border-[#27272A] text-white placeholder-[#71717A]' : 'bg-white border-[#E7E5E4]'}`}
                      />
                      {filteredCountries.map((c) => (
                        <button key={c.code} type="button" onClick={() => { setSelectedCountry(c); setShowDropdown(false); setSearchTerm(''); }}
                          className={`w-full text-left px-3 py-2.5 text-sm flex gap-3 items-center ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}
                        >
                          <span>{c.flag}</span><span className="truncate">{c.name}</span>
                          <span className={`ml-auto text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{c.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 relative">
                    <FaPhone className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
                    <input id="phone-input" type="text" placeholder="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`${inputCls(errLogin.phoneNumber)} pl-10`}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 py-1">
                  <div className={`flex-1 h-px ${isDark ? 'bg-[#27272A]' : 'bg-[#E7E5E4]'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-[#3F3F46]' : 'text-[#D6D3D1]'}`}>or</span>
                  <div className={`flex-1 h-px ${isDark ? 'bg-[#27272A]' : 'bg-[#E7E5E4]'}`} />
                </div>

                {/* Email */}
                <div className="relative">
                  <FaEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
                  <input id="email-input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={`${inputCls(errLogin.email)} pl-11`}
                  />
                </div>

                <button id="send-otp-btn" type="submit" disabled={loading}
                  className="w-full py-3.5 accent-gradient text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? <Spinner /> : 'Continue →'}
                </button>
              </motion.form>
            )}

            {/* ══════ STEP 2 ══════ */}
            {step === 2 && (
              <motion.form key="s2" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }} onSubmit={submitOtp(onOTPSubmit)} className="space-y-5">
                <p className={`text-sm text-center ${isDark ? 'text-[#A1A1AA]' : 'text-[#78716C]'}`}>
                  Code sent to {userPhoneData?.email ? 'your email' : 'your phone'}
                </p>

                {userPhoneData?.fallbackOtp && (
                  <div className={`p-4 rounded-2xl text-center border-2 border-dashed ${isDark ? 'border-[#F97316]/30 bg-[#F97316]/5' : 'border-orange-300 bg-orange-50'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#F97316] mb-2">Dev Code</p>
                    <span className="text-3xl font-extrabold tracking-[0.3em] text-[#F97316] font-mono">
                      {userPhoneData.fallbackOtp}
                    </span>
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  {otp.map((digit, idx) => (
                    <input key={idx} id={`otp-${idx}`} type="text" maxLength={1} value={digit}
                      onChange={(e) => handleOTPChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(idx, e)}
                      className={`w-12 h-14 text-center rounded-2xl border-2 outline-none text-lg font-bold transition-all duration-200 ${
                        errOtp.otp ? 'border-red-500/60' :
                        digit ? `border-[#F97316] ${isDark ? 'bg-[#F97316]/10 text-[#FAFAFA]' : 'bg-orange-50 text-[#0C0A09]'}` :
                        isDark ? 'bg-[#18181B] border-[#27272A] text-[#FAFAFA] focus:border-[#F97316]' : 'bg-[#F5F5F4] border-[#E7E5E4] focus:border-[#F97316]'
                      }`}
                    />
                  ))}
                </div>
                {errOtp.otp && <p className="text-red-400 text-xs text-center">{errOtp.otp.message}</p>}

                <button id="verify-otp-btn" type="submit" disabled={loading}
                  className="w-full py-3.5 accent-gradient text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loading ? <Spinner /> : 'Verify →'}
                </button>

                <button type="button" onClick={handleBack}
                  className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-medium transition-colors ${isDark ? 'text-[#71717A] hover:text-[#FAFAFA]' : 'text-[#A8A29E] hover:text-[#0C0A09]'}`}
                >
                  <FaArrowLeft className="text-[10px]" /> Go back
                </button>
              </motion.form>
            )}

            {/* ══════ STEP 3 ══════ */}
            {step === 3 && (
              <motion.form key="s3" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }} onSubmit={submitProfile(onProfileSubmit)} className="space-y-5">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-3">
                    <div className="w-full h-full rounded-full accent-gradient p-[3px]">
                      <div className={`w-full h-full rounded-full overflow-hidden ${isDark ? 'bg-[#18181B]' : 'bg-white'}`}>
                        <img src={profilePicturePreview || selectedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <label htmlFor="file-upload" className="absolute -bottom-1 -right-1 w-8 h-8 accent-gradient rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-orange-500/30 hover:scale-110 transition-transform">
                      <FaPlus className="w-3 h-3 text-white" />
                    </label>
                    <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </div>
                  <span className={`text-[11px] ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Upload or pick avatar</span>
                </div>

                {/* Avatar presets */}
                <div className="flex justify-center gap-2.5">
                  {avatarSeeds.map((seed, idx) => {
                    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                    const isSelected = selectedAvatar === url && !profilePicturePreview;
                    return (
                      <motion.img key={idx} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} src={url} alt={`Avatar ${idx}`}
                        onClick={() => { setSelectedAvatar(url); setProfilePictureFile(null); setProfilePicturePreview(null); }}
                        className={`w-11 h-11 rounded-full cursor-pointer border-2 transition-all ${isSelected ? 'border-[#F97316] shadow-md shadow-orange-500/20 scale-110' : isDark ? 'border-[#27272A] hover:border-[#3F3F46]' : 'border-[#E7E5E4] hover:border-[#D6D3D1]'}`}
                      />
                    );
                  })}
                </div>

                {/* Username */}
                <div className="relative">
                  <FaUser className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
                  <input id="username-input" type="text" placeholder="Your display name" {...regProfile('username')}
                    className={`${inputCls(errProfile.username)} pl-11`}
                  />
                </div>
                {errProfile.username && <p className="text-red-400 text-xs">{errProfile.username.message}</p>}

                {/* Terms */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input id="agreed-checkbox" type="checkbox" {...regProfile('agreed')}
                    className="w-4 h-4 rounded accent-[#F97316] cursor-pointer"
                  />
                  <span className={`text-xs ${isDark ? 'text-[#A1A1AA] group-hover:text-[#FAFAFA]' : 'text-[#78716C] group-hover:text-[#0C0A09]'} transition-colors`}>
                    I agree to the <span className="text-[#F97316] hover:underline cursor-pointer font-medium">Terms & Conditions</span>
                  </span>
                </label>

                <button id="create-account-btn" type="submit" disabled={loading || !agreedWatched}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${loading || !agreedWatched ? 'bg-[#27272A] text-[#71717A] cursor-not-allowed shadow-none' : 'accent-gradient text-white shadow-orange-500/20 hover:brightness-110'}`}
                >
                  {loading ? <Spinner /> : 'Create Account →'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
