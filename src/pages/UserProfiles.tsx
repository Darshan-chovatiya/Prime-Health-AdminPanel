import { useState, useEffect } from "react";
import { Eye, EyeOff, UserCircle, Mail, Lock, CheckCircle, Calendar, User } from "lucide-react";
import Swal from 'sweetalert2'; // Import SweetAlert2
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Form from "../components/form/Form";
import api from "../services/api"; // Adjust path to your API class instance

interface UserProfile {
  email: string;
  name: string; // Added name
  role: string;
  joinDate: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfiles() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: "",
    name: "",
    role: "",
    joinDate: ""
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: ""
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState({
    profile: "",
    password: "",
    general: ""
  });

  const [isLoading, setIsLoading] = useState({
    profile: false,
    password: false
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.getProfile();
        if (response.status === 200) {
          const admin = response.data.admin;
          setUserProfile({
            email: admin.email,
            name: admin.name,
            role: admin.role,
            joinDate: admin.createdAt
          });
          setProfileForm({
            name: admin.name,
            email: admin.email
          });
        } else {
          setErrors(prev => ({ ...prev, general: response.message || "Failed to load profile" }));
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Failed to load profile',
            timer: 3000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, general: "Failed to load profile. Please try again." }));
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load profile. Please try again.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    };

    fetchProfile();
  }, []);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  // Handle profile update (name and email)
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, profile: true }));
    setErrors(prev => ({ ...prev, profile: "" }));

    // Validation
    if (!profileForm.name || !profileForm.email) {
      setErrors(prev => ({ ...prev, profile: "Name and email are required" }));
      setIsLoading(prev => ({ ...prev, profile: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Name and email are required',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    if (!validateEmail(profileForm.email)) {
      setErrors(prev => ({ ...prev, profile: "Please enter a valid email address" }));
      setIsLoading(prev => ({ ...prev, profile: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a valid email address',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    if (profileForm.email === userProfile.email && profileForm.name === userProfile.name) {
      setErrors(prev => ({ ...prev, profile: "No changes detected" }));
      setIsLoading(prev => ({ ...prev, profile: false }));
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'No changes detected',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    try {
      const response = await api.updateProfile({
        name: profileForm.name,
        email: profileForm.email
      });
      if (response.status === 200) {
        setUserProfile(prev => ({
          ...prev,
          name: response.data.admin.name,
          email: response.data.admin.email
        }));
        // setSuccess(prev => ({ ...prev, profile: true }));
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Profile updated successfully!',
          timer: 3000,
          showConfirmButton: false
        });
        setTimeout(() => {
          // setSuccess(prev => ({ ...prev, profile: false }));
        }, 3000);
      } else {
        setErrors(prev => ({ ...prev, profile: response.message || "Failed to update profile" }));
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to update profile',
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, profile: "Failed to update profile. Please try again." }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update profile. Please try again.',
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: "" }));

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setErrors(prev => ({ ...prev, password: "All fields are required" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'All fields are required',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      setErrors(prev => ({ ...prev, password: "Password does not meet requirements" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Password does not meet requirements',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors(prev => ({ ...prev, password: "New passwords do not match" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'New passwords do not match',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setErrors(prev => ({ ...prev, password: "New password must be different from current password" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'New password must be different from current password',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }

    try {
      const response = await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (response.status === 200) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        // setSuccess(prev => ({ ...prev, password: true }));
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password changed successfully!',
          timer: 3000,
          showConfirmButton: false
        });
        setTimeout(() => {
          // setSuccess(prev => ({ ...prev, password: false }));
        }, 3000);
      } else {
        setErrors(prev => ({ ...prev, password: response.message || "Failed to change password" }));
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to change password',
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, password: "Failed to change password. Please try again." }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to change password. Please try again.',
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <UserCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {userProfile.name || 'Admin Profile'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{userProfile.role}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member since {userProfile.joinDate ? new Date(userProfile.joinDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Update Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Update Profile
          </h3>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Label htmlFor="currentEmail" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            Current Email
          </Label>
          <Input
            id="currentEmail"
            value={userProfile.email}
            disabled
            className="bg-gray-100 dark:bg-gray-700"
          />
        </div>

        {errors.general && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errors.general}</p>
        )}

        <Form onSubmit={handleProfileUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.profile}
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                error={!!errors.profile}
              />
            </div>
          </div>
          
          {errors.profile && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.profile}</p>
          )}
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading.profile}
              className={`w-full md:w-auto px-4 py-2 rounded-md font-medium transition-colors duration-200 
                ${isLoading.profile 
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 text-white"
                }`}
            >
              {isLoading.profile ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </Form>
      </div>

      {/* Password Change Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Change Password
          </h3>
        </div>

        <Form onSubmit={handlePasswordChange}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="currentPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                Current Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                >
                  {showPasswords.current ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                >
                  {showPasswords.new ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                Confirm New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                >
                  {showPasswords.confirm ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {passwordForm.newPassword && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password Requirements:
                </h4>
                <ul className="text-sm space-y-1">
                  <li className={`flex items-center gap-2 ${passwordForm.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className={passwordForm.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}>•</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}>•</span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className={/[a-z]/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}>•</span>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/\d/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className={/\d/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}>•</span>
                    One number
                  </li>
                  <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}>•</span>
                    One special character
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
          )}
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading.password}
              className={`w-full md:w-auto px-4 py-2 rounded-md font-medium transition-colors duration-200 
                ${isLoading.password
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
                }`}
            >
              {isLoading.password ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}