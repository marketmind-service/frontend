"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/auth/supabaseClient";

export default function AuthSidebarSection({ onAction }: { onAction?: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch and subscribe to session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    if (onAction) onAction();
  }

  // Loading state
  if (loading) {
    return (
      <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-500">
        Checking session…
      </div>
    );
  }

  // Not logged in → show sign up / login
  if (!user) {
    return (
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        <Link
          href="/signup"
          className="block w-full text-center rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold py-2"
          onClick={onAction}
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="block w-full text-center rounded-lg border border-slate-600 hover:border-sky-400 text-sm font-semibold py-2"
          onClick={onAction}
        >
          Log In
        </Link>
      </div>
    );
  }

  // Logged in → show user avatar + logout
  return (
    <div className="px-4 py-4 border-t border-slate-800 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold">
          {user.email?.charAt(0).toUpperCase() ?? "U"}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Signed in as</span>
          <span className="text-sm">{user.email}</span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full rounded-lg border border-slate-600 hover:border-rose-500 text-xs font-semibold py-2"
      >
        Log Out
      </button>
    </div>
  );
}
