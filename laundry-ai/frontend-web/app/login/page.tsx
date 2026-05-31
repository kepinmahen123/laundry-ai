"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabaseUrl = "https://siutldehyyiaaibdxexg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdXRsZGVoeXlpYWFpYmR4ZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTQ0MTYsImV4cCI6MjA5NTU3MDQxNn0.u1lpRzvierjPsDxRPI4-RwaWZ2z3WPp2cjoZe7P3QAk";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Jika sudah punya sesi login aktif, langsung lempar ke Dashboard utama
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/");
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg("Gagal: Email atau Password salah.");
      setLoading(false);
    } else {
      router.push("/"); 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border">
        <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-6">🔒 Portal Admin LaundroAI</h1>
        {errorMsg && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center font-bold">{errorMsg}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email Admin" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-gray-900" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-gray-900" required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95">
            {loading ? "Memverifikasi..." : "Masuk Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}