"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function Login() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // State untuk modal password setelah kotak toko diklik
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mengambil data semua mitra toko dari database saat halaman dibuka
  useEffect(() => {
    async function fetchStores() {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, email")
        .order("name", { ascending: true });
        
      if (data) setStores(data);
      setLoadingData(false);
    }
    fetchStores();
  }, []);

  const handlePilihToko = (toko: any) => {
    if (!toko.email) {
      Swal.fire('Info', 'Toko ini belum dikonfigurasi dengan email oleh Super Admin.', 'info');
      return;
    }
    setSelectedStore(toko);
    setPassword("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setIsLoggingIn(true);
    
    // Melakukan proses otentikasi menggunakan email dari kotak yang diklik
    const { error } = await supabase.auth.signInWithPassword({ 
      email: selectedStore.email, 
      password: password 
    });
    
    if (error) {
      Swal.fire('Akses Ditolak', 'Kata sandi toko salah!', 'error');
      setIsLoggingIn(false);
    } else {
      // 🚀 Jika berhasil, arahkan ke Layar Netflix (Dashboard)
      router.push("/"); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      
      {/* BACKGROUND DEKORASI */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* HEADER LOGO */}
      <div className="mt-10 mb-12 text-center z-10 animate-fade-in-down">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          LaundroAI
        </h1>
        <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Portal Kemitraan POS</p>
      </div>

      {/* TAMPILAN KETIKA LOADING DATA */}
      {loadingData ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full max-w-6xl z-10">
          <h2 className="text-xl font-bold text-white mb-6 text-center md:text-left">Pilih Cabang / Toko Anda:</h2>
          
          {/* GRID FLYING BOXES */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {stores.map((toko) => (
              <div 
                key={toko.id} 
                onClick={() => handlePilihToko(toko)}
                className="group cursor-pointer relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-3 hover:bg-white/10 hover:border-blue-500/50 hover:shadow-[0_15px_35px_rgba(59,130,246,0.2)]"
              >
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  🏪
                </div>
                <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{toko.name}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Mitra Aktif</p>
              </div>
            ))}
            
            {stores.length === 0 && (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500 italic">Belum ada toko yang terdaftar di database.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL INPUT PASSWORD TOKO */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={() => !isLoggingIn && setSelectedStore(null)}>
          <div className="bg-slate-900 border border-white/20 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedStore(null)} className="absolute top-4 right-5 text-gray-400 hover:text-white text-xl">✕</button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">
                🏪
              </div>
              <h2 className="text-xl font-bold text-white">{selectedStore.name}</h2>
              <p className="text-xs text-gray-400 mt-1">Otentikasi Kunci Utama Toko</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <input 
                  type="password" 
                  required
                  autoFocus
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-[0.3em] font-mono outline-none focus:border-blue-500 transition-all" 
                  placeholder="KATA SANDI"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoggingIn || !password}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {isLoggingIn ? "Membuka..." : "Buka Kunci Toko 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}