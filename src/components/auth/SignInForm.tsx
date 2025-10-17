import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../context/AuthContext";
import swal from '../../utils/swalHelper';

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      swal.error('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      
      swal.success('Success', 'Login successful!');
      
      navigate('/');
    } catch (error: any) {
      swal.error('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center">
      <Link to="/" className="">
        <img
          width={200}
          height={36}
          src="/images/logo/Prime Health.png"
          alt="Prime Health Logo"
          className="mx-auto"
        />
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white text-center">
        Welcome to Prime Health Admin
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        Securely access your admin dashboard
      </p>
      <form className="w-full space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="email" 
            placeholder="admin@primehealth.com" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // required
          />
        </div>
        <div>
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-12 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800 dark:bg-gray-900 dark:placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeIcon className="h-5 w-5 fill-current" />
              ) : (
                <EyeCloseIcon className="h-5 w-5 fill-current" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox checked={isChecked} onChange={setIsChecked} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </span>
          </div>
          <Link
            to="/reset-password"
            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            Forgot password?
          </Link>
        </div>
<button
  className="w-full bg-green-600 hover:bg-green-700 text-white mb-6 py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  type="submit"
  disabled={loading}
>
  {loading ? 'Signing In...' : 'Sign In'}
</button>

      </form>
    </div>
  );
}