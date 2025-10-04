
import { useState } from "react";
import { Eye, EyeOff, UserCircle, Mail, Lock, CheckCircle, Calendar } from "lucide-react";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Button from "../components/ui/button/Button";
import Form from "../components/form/Form";

interface UserProfile {
  email: string;
  role: string;
  joinDate: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfiles() {
  // Mock user data - in real app, this would come from API/context
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: "admin@primehealth.com",
    role: "Administrator",
    joinDate: "2024-01-15"
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    confirmEmail: ""
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
    email: "",
    password: "",
    general: ""
  });

  const [success, setSuccess] = useState({
    email: false,
    password: false
  });

  const [isLoading, setIsLoading] = useState({
    email: false,
    password: false
  });

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

  // Handle email update
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: "" }));

    // Validation
    if (!emailForm.newEmail || !emailForm.confirmEmail) {
      setErrors(prev => ({ ...prev, email: "All fields are required" }));
      setIsLoading(prev => ({ ...prev, email: false }));
      return;
    }

    if (!validateEmail(emailForm.newEmail)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      setIsLoading(prev => ({ ...prev, email: false }));
      return;
    }

    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setErrors(prev => ({ ...prev, email: "Email addresses do not match" }));
      setIsLoading(prev => ({ ...prev, email: false }));
      return;
    }

    if (emailForm.newEmail === userProfile.email) {
      setErrors(prev => ({ ...prev, email: "New email must be different from current email" }));
      setIsLoading(prev => ({ ...prev, email: false }));
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUserProfile(prev => ({ ...prev, email: emailForm.newEmail }));
      setEmailForm({ newEmail: "", confirmEmail: "" });
      setSuccess(prev => ({ ...prev, email: true }));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, email: false }));
      }, 3000);
    } catch (error) {
      setErrors(prev => ({ ...prev, email: "Failed to update email. Please try again." }));
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }));
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
      return;
    }

    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      setErrors(prev => ({ ...prev, password: "Password does not meet requirements" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors(prev => ({ ...prev, password: "New passwords do not match" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setErrors(prev => ({ ...prev, password: "New password must be different from current password" }));
      setIsLoading(prev => ({ ...prev, password: false }));
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(prev => ({ ...prev, password: true }));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, password: false }));
      }, 3000);
    } catch (error) {
      setErrors(prev => ({ ...prev, password: "Failed to change password. Please try again." }));
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
              Admin Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{userProfile.role}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member since {new Date(userProfile.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Email Update Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Update Email Address
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

        {success.email && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">Email updated successfully!</span>
          </div>
        )}

        <Form onSubmit={handleEmailUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="newEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                New Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="Enter new email address"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                error={!!errors.email}
              />
            </div>
            <div>
              <Label htmlFor="confirmEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                Confirm Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="Confirm new email address"
                value={emailForm.confirmEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, confirmEmail: e.target.value }))}
                error={!!errors.email}
              />
            </div>
          </div>
          
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
          
          <div className="mt-6">
            <Button
              type="submit"
              disabled={isLoading.email}
              className="w-full md:w-auto"
            >
              {isLoading.email ? "Updating..." : "Update Email"}
            </Button>
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

        {success.password && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">Password changed successfully!</span>
          </div>
        )}

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
            <Button
              type="submit"
              disabled={isLoading.password}
              className="w-full md:w-auto"
            >
              {isLoading.password ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
