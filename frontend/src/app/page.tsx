"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckSquare, ArrowRight, Shield, Mail, Users, CheckCircle2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        router.push("/dashboard");
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        router.push("/dashboard");
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Error logging in: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white overflow-hidden p-6">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <main className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center space-y-8">
        {/* Logo Icon */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-5 py-2.5 rounded-full backdrop-blur-md shadow-lg">
          <CheckSquare className="w-6 h-6 text-indigo-400 animate-pulse" />
          <span className="font-semibold tracking-wider text-sm bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">TASKFLOW AI</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-2xl leading-[1.1]">
          Collaborative task management, <br/>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            elevated for modern teams.
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-xl">
          Assign tasks, trigger instant Gmail notifications, and sync your team's workflow in real-time.
        </p>

        {/* Login Card */}
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Get Started</h2>
          <p className="text-sm text-slate-400">
            Sign in with your Gmail/Google account to manage your workspace and start collaborating.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-medium py-3.5 px-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.79 5.79 0 0 1-2.49 3.8v3.12h4.01c2.34-2.15 3.69-5.32 3.69-8.77Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.12c-1.12.75-2.55 1.19-3.95 1.19-3.05 0-5.63-2.06-6.55-4.83H1.31v3.23A12.001 12.001 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.45 14.33a7.149 7.149 0 0 1 0-4.66V6.44H1.31a12.001 12.001 0 0 0 0 11.12l4.14-3.23Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.31 0 3.25 2.71 1.31 6.44l4.14 3.23c.92-2.77 3.5-4.83 6.55-4.83Z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8 text-left">
          <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-sm space-y-3">
            <div className="bg-indigo-500/10 p-3 rounded-xl w-fit border border-indigo-500/20 text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Secure Google Login</h3>
            <p className="text-sm text-slate-400">Authentication powered by Supabase Auth and Google OAuth 2.0.</p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-sm space-y-3">
            <div className="bg-purple-500/10 p-3 rounded-xl w-fit border border-purple-500/20 text-purple-400">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Gmail Notifications</h3>
            <p className="text-sm text-slate-400">Instant notification emails on task assignment and status updates.</p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-sm space-y-3">
            <div className="bg-pink-500/10 p-3 rounded-xl w-fit border border-pink-500/20 text-pink-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Seamless Assignment</h3>
            <p className="text-sm text-slate-400">Assign tasks to other registered members of your workspace easily.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 text-slate-500 text-xs flex gap-4">
        <span>© {new Date().getFullYear()} TaskFlow AI. All rights reserved.</span>
      </footer>
    </div>
  );
}
