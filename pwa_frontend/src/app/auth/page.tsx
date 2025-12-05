'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import {
  LoginValues,
  validateUserCreate,
  validateLogin,
  isUserCreateValid,
  isLoginValid,
  UserCreationValues
} from '@/lib/validation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';



type Mode = 'login' | 'register';

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tempShowPassword, setTempShowPassword] = useState(false);
  const [tempShowConfirmPassword, setTempShowConfirmPassword] = useState(false);
  const router = useRouter();

  const title =
    mode === 'login' ? 'Sign in to your account' : 'User Creation Form';
  const subtitle =
    mode === 'login'
      ? 'Access your dashboard using your email and password.'
      : 'Create a new user by filling all mandatory fields.';

  const toggleText =
    mode === 'login' ? "Don't have an account?" : 'Already have an account?';
  const toggleButtonLabel = mode === 'login' ? 'Register' : 'Sign in';

  const passwordRevealTimeout = useRef<number | null>(null);
  const confirmPasswordRevealTimeout = useRef<number | null>(null);

  const getRegisterValues = (): UserCreationValues => ({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
  });

  const getLoginValues = (): LoginValues => ({
    email,
    password,
  });

  const validate = (): boolean => {
    if (mode === 'register') {
      const validationErrors = validateUserCreate(getRegisterValues());
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    } else {
      const validationErrors = validateLogin(getLoginValues());
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const ok = validate();
    if (!ok) return;

    setLoading(true);

    try {
      const body =
        mode === 'register'
          ? {
            email: email.trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            // name: `${firstName.trim()} ${lastName.trim()}`, // if backend expects `name`
          }
          : {
            email: email.trim(),
            password,
          };

      const data = await apiFetch(
        `/api/auth/${mode === 'login' ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        document.cookie = `token=${data.token}; path=/; max-age=86400;`;
      }

      if (mode === 'register') {
        toast.success("User created successfully", {
          description: `User ${firstName.trim()} ${lastName.trim()} has been created.`,
        });
      } else {
        toast.success("Login successful", {
          description: `Welcome back! ${firstName.trim()} ${lastName.trim()}`,
        });
      }

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Unexpected error, please try again.';
      setErrors(prev => ({ ...prev, form: msg }));

      toast.error('Error', {
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);

    // flash characters for a split second only when not permanently visible
    if (!showPassword) {
      setTempShowPassword(true);
      if (passwordRevealTimeout.current) {
        window.clearTimeout(passwordRevealTimeout.current);
      }
      passwordRevealTimeout.current = window.setTimeout(() => {
        setTempShowPassword(false);
      }, 700); // 700ms, tweak as you like
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);

    if (!showConfirmPassword) {
      setTempShowConfirmPassword(true);
      if (confirmPasswordRevealTimeout.current) {
        window.clearTimeout(confirmPasswordRevealTimeout.current);
      }
      confirmPasswordRevealTimeout.current = window.setTimeout(() => {
        setTempShowConfirmPassword(false);
      }, 700);
    }
  };


  useEffect(() => {
    return () => {
      if (passwordRevealTimeout.current) {
        window.clearTimeout(passwordRevealTimeout.current);
      }
      if (confirmPasswordRevealTimeout.current) {
        window.clearTimeout(confirmPasswordRevealTimeout.current);
      }
    };
  }, []);


  const hasError = (field: keyof FieldErrors) => !!errors[field];

  const registerValid = isUserCreateValid(getRegisterValues());
  const loginValid = isLoginValid(getLoginValues());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full grid gap-10 md:grid-cols-[1.1fr,0.9fr] items-center">
        <Card className="w-full max-w-md mx-auto border-slate-800 bg-slate-950/80 shadow-xl shadow-sky-950/30">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-slate-50">
              {title}
            </CardTitle>
            <CardDescription className="text-center text-slate-400 text-xs">
              {subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              {mode === 'register' && (
                <>
                  <div className="space-y-1">
                    <Label
                      htmlFor="firstName"
                      className="text-xs text-slate-200"
                    >
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First Name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className={`h-9 text-sm bg-slate-900/70 border-slate-700 focus-visible:ring-sky-500 ${hasError('firstName') ? 'border-red-500' : ''
                        }`}
                    />
                    {errors.firstName && (
                      <p className="text-[11px] font-bold text-red-500 mt-0.5">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="lastName"
                      className="text-xs text-slate-200"
                    >
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className={`h-9 text-sm bg-slate-900/70 border-slate-700 focus-visible:ring-sky-500 ${hasError('lastName') ? 'border-red-500' : ''
                        }`}
                    />
                    {errors.lastName && (
                      <p className="text-[11px] font-bold text-red-500 mt-0.5">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs text-slate-200">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`h-9 text-sm bg-slate-900/70 border-slate-700 focus-visible:ring-sky-500 ${hasError('email') ? 'border-red-500' : ''
                    }`}
                />
                {errors.email && (
                  <p className="text-[11px] font-bold text-red-500 mt-0.5">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs text-slate-200">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword || tempShowPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`h-9 text-sm bg-slate-900/70 border-slate-700 focus-visible:ring-sky-500 pr-9 ${hasError('password') ? 'border-red-500' : ''
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(prev => !prev)
                    }
                    className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] font-bold text-red-500 mt-0.5">
                    {errors.password}
                  </p>
                )}
              </div>

              {mode === 'register' && (
                <div className="space-y-1">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs text-slate-200"
                  >
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={
                        showConfirmPassword || tempShowConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      className={`h-9 text-sm bg-slate-900/70 border-slate-700 focus-visible:ring-sky-500 pr-9 ${hasError('confirmPassword') ? 'border-red-500' : ''
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(prev => !prev)
                      }
                      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-200"
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] font-bold text-red-500 mt-0.5">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {errors.form && (
                <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-md px-3 py-1.5">
                  {errors.form}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 h-9 text-sm font-medium bg-sky-600 hover:bg-sky-500"
                  // disabled={
                  //   loading ||
                  //   (mode === 'register' && !registerValid) ||
                  //   (mode === 'login' && !loginValid)
                  // }
                >
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Sign in'
                      : 'Save'}
                </Button>

                {mode === 'register' && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 text-sm border-slate-700 text-slate-200"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
              <span>{toggleText}</span>
              <button
                type="button"
                className="font-medium text-sky-400 hover:text-sky-300 underline-offset-4 hover:underline"
                onClick={() => {
                  setErrors({});
                  setMode(mode === 'login' ? 'register' : 'login');
                  resetForm();
                }}
              >
                {toggleButtonLabel}
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
