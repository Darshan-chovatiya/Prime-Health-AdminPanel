import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
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
      <form className="w-full space-y-6">
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input id="email" placeholder="admin@primehealth.com" type="email" />
        </div>
        <div>
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
            >
              {showPassword ? (
                <EyeIcon className="h-5 w-5" />
              ) : (
                <EyeCloseIcon className="h-5 w-5" />
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
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white mb-6" size="md">
          Sign In
        </Button>
      </form>
    </div>
  );
}