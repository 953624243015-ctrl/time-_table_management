import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Cpu, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: 'admin@college.edu', password: 'Admin@123' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Timetable</h1>
              <p className="text-blue-200 text-sm">Management System</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Intelligent Scheduling for Modern Colleges</h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Powered by Genetic Algorithm AI to generate conflict-free, optimized timetables automatically.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[['Departments', 'Manage academic departments'],['Faculty', 'Track staff workload'],['Classes', 'Organize class sections'],['AI Engine', 'Zero-conflict schedules']].map(([t, d]) => (
              <div key={t} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="font-semibold text-white">{t}</p>
                <p className="text-blue-200 text-xs mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">AI Timetable System</p>
              <p className="text-xs text-slate-400">College Management</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field pl-10"
                  placeholder="admin@college.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Demo Credentials</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Email: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">admin@college.edu</code></p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Password: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">Admin@123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
