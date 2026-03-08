import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  const handleGoogle = () => {
    // Use Google Identity Services one-tap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google || !GOOGLE_CLIENT_ID) return;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/google`, {
            idToken: response.credential,
          });
          setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
          navigate("/", { replace: true });
        } catch (err: any) {
          setError(err.response?.data?.error || "Google login failed");
        }
      },
    });
    google.accounts.id.prompt();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Sign in to TeamSync
        </h1>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800"
          >
            Sign in
          </button>
        </form>
        <button
          type="button"
          onClick={handleGoogle}
          className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
        >
          Continue with Google
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-slate-900 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
