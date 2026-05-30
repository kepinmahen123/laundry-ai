"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

// KONFIGURASI SUPABASE & TELEGRAM
const supabaseUrl = "https://siutldehyyiaaibdxexg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdXRsZGVoeXlpYWFpYmR4ZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTQ0MTYsImV4cCI6MjA5NTU3MDQxNn0.u1lpRzvierjPsDxRPI4-RwaWZ2z3WPp2cjoZe7P3QAk";
const supabase = createClient(supabaseUrl, supabaseKey);

const telegramToken = "8677964593:AAET5YSSs216dA8sWtSJKLWWJED03v4qGVc"; 
const chatId = "1556373134"; 
const GOOGLE_MAPS_API_KEY = "MASUKKAN_API_KEY_DISINI"; 

const defaultMapCenter = { lat: -6.2088, lng: 106.8456 }; 
const mapContainerStyle = { width: "100%", height: "600px", borderRadius: "16px" };

export default function Dashboard() {
  const router = useRouter();

  // STATE UTAMA
  const [pesanan, setPesanan] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]); 
  const [session, setSession] = useState<any>(null); 
  const [loading, setLoading] = useState(true); 
  
  // STATE UI & LAYOUT
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [viewMode, setViewMode] = useState<string>("table");
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Sidebar State
  const [completionDate, setCompletionDate] = useState<string | null>(null); // Tanggal Selesai
  
  // STATE FILTER
  const [sortBy, setSortBy] = useState<"terbaru" | "terdekat">("terbaru");
  const [filterTanggal, setFilterTanggal] = useState<string>(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }); 

  // STATE MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false); 
  const [showSuggestions, setShowSuggestions] = useState(false); 
  const [formData, setFormData] = useState({ 
    customer_name: "", alamat_detail: "", jarak_ke_toko_km: "", berat_pesanan_kg: "", latitude: "", longitude: "" 
  });

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    name: "", alamat_detail: "", jarak_ke_toko_km: "", latitude: "", longitude: ""
  });

  // STATE KAMERA/FOTO
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [buktiFotoUrls, setBuktiFotoUrls] = useState<{[key: number]: string}>({});
  const [previewTargetUrl, setPreviewTargetUrl] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [timerTick, setTimerTick] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  const { isLoaded: isMapLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  useEffect(() => {
    async function cekKeamanan() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else { setSession(session); ambilData(); }
      setLoading(false);
    }
    cekKeamanan();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => setTimerTick(prev => prev + 1), 60000); 
    return () => clearInterval(interval);
  }, []);

  async function ambilData() {
    const { data: ordersData } = await supabase.from("orders").select("*").order("id", { ascending: false });
    if (Array.isArray(ordersData)) setPesanan(ordersData);

    const { data: customersData } = await supabase.from("customers").select("*").order("name", { ascending: true });
    if (Array.isArray(customersData)) setCustomers(customersData);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function hitungWaktuTunggu(waktuDibuat: string) {
    if (!waktuDibuat) return "-";
    const sekarang = new Date();
    const dibuat = new Date(waktuDibuat);
    const selisihMs = Math.max(0, sekarang.getTime() - dibuat.getTime());
    const selisihMenitTotal = Math.floor(selisihMs / (1000 * 60));
    
    if (selisihMenitTotal < 60) return `${selisihMenitTotal} mnt lalu`;
    const selisihJam = Math.floor(selisihMenitTotal / 60);
    const sisaMenit = selisihMenitTotal % 60;
    
    if (selisihJam < 24) return `${selisihJam}j ${sisaMenit}m lalu`;
    const selisihHari = Math.floor(selisihJam / 24);
    return `${selisihHari} hari lalu`;
  }

  function bukaModalFoto(id: number, nama: string) {
    setSelectedOrder({ id, customer_name: nama });
    setDeliveryPhoto(null); setLivePreviewUrl(null); setIsPhotoModalOpen(true);
  }

  function handlePilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setDeliveryPhoto(file);
    if (file) setLivePreviewUrl(URL.createObjectURL(file));
    else setLivePreviewUrl(null);
  }

  function lihatFotoBukti(idPesanan: number) {
    if (buktiFotoUrls[idPesanan]) {
      setPreviewTargetUrl(buktiFotoUrls[idPesanan]); setIsPreviewOpen(true);
    } else {
      alert("📱 Foto bukti pengiriman lama tidak disimpan di server untuk menghemat memori. Silakan cek langsung riwayat pesan di Bot Telegram Anda.");
    }
  }

  // FUNGSI UPLOAD FOTO & CATAT WAKTU SELESAI
  async function kirimBuktiSelesai(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !deliveryPhoto) return;
    setIsUploadingPhoto(true);

    try {
      const { error } = await supabase.from("orders").update({ status_logistik: "selesai" }).eq("id", selectedOrder.id);
      if (error) throw new Error(error.message);

      // Ambil waktu saat ini persis saat foto dikirim
      const sekarang = new Date();
      const opsiOtomatis: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      };
      const waktuSelesai = sekarang.toLocaleDateString('id-ID', opsiOtomatis) + ' WIB';
      setCompletionDate(waktuSelesai);

      const pesanCaption = `✅ *PESANAN SELESAI*\n\nHalo kak ${selectedOrder.customer_name}! Cucian kamu sudah selesai diproses dan tiba di lokasi.\n🕒 *Waktu Selesai:* ${waktuSelesai}\n📦 Terima kasih!`;
      const fileData = new FormData();
      fileData.append("chat_id", chatId);
      fileData.append("photo", deliveryPhoto);
      fileData.append("caption", pesanCaption);
      fileData.append("parse_mode", "Markdown");

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, { method: "POST", body: fileData });

      if (livePreviewUrl) setBuktiFotoUrls(prev => ({ ...prev, [selectedOrder.id]: livePreviewUrl }));
      
      // Tampilkan Notifikasi Waktu ke Kurir
      alert(`🎉 Pengiriman Berhasil!\nWaktu Penyelesaian: ${waktuSelesai}`);
      
    } catch (err) { 
      alert("Gagal memproses penyelesaian pesanan."); 
    } finally {
      setIsUploadingPhoto(false); setIsPhotoModalOpen(false); setSelectedOrder(null); setDeliveryPhoto(null); ambilData(); 
    }
  }

  async function handleTambahPesanan(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from("orders").insert([
      { 
        customer_name: formData.customer_name, 
        alamat_detail: formData.alamat_detail, 
        jarak_ke_toko_km: Number(formData.jarak_ke_toko_km), 
        berat_pesanan_kg: Number(formData.berat_pesanan_kg), 
        latitude: Number(formData.latitude), 
        longitude: Number(formData.longitude), 
        status_logistik: "pickup" 
      }
    ]);
    setIsSubmitting(false);
    if (error) alert("Gagal: " + error.message);
    else { setIsModalOpen(false); setFormData({ customer_name: "", alamat_detail: "", jarak_ke_toko_km: "", berat_pesanan_kg: "", latitude: "", longitude: "" }); ambilData(); }
  }

  async function handleTambahCustomer(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingCustomer(true);
    const { error } = await supabase.from("customers").insert([
      {
        name: customerFormData.name,
        alamat_detail: customerFormData.alamat_detail,
        jarak_ke_toko_km: Number(customerFormData.jarak_ke_toko_km),
        latitude: Number(customerFormData.latitude),
        longitude: Number(customerFormData.longitude)
      }
    ]);
    setIsSubmittingCustomer(false);
    if (error) alert("Gagal menyimpan data pelanggan. Error: " + error.message);
    else { setIsCustomerModalOpen(false); setCustomerFormData({ name: "", alamat_detail: "", jarak_ke_toko_km: "", latitude: "", longitude: "" }); ambilData(); }
  }

  async function generateDanKirimLaporan() {
    setIsExporting(true);
    try {
      let barisCsv = "ID Pesanan,Tanggal,Nama Pelanggan,Alamat Detail,Jarak (KM),Berat (KG),Status Logistik,Lat,Lng\n";
      dataTersaring.forEach((item) => {
        const d = item.created_at ? new Date(item.created_at) : new Date();
        const tgl = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        barisCsv += `${item.id || "-"},${tgl},${String(item.customer_name || "-").replace(/,/g, " ")},${String(item.alamat_detail || "-").replace(/,/g, " ")},${item.jarak_ke_toko_km || "0"},${item.berat_pesanan_kg || "0"},${item.status_logistik || "-"},${item.latitude || "-"},${item.longitude || "-"}\n`;
      });
      const blob = new Blob([barisCsv], { type: "text/csv;charset=utf-8;" });
      const fileLaporan = new FormData();
      fileLaporan.append("chat_id", chatId);
      fileLaporan.append("document", blob, `Laporan_Laundry_${filterTanggal || "Semua_Waktu"}.csv`);
      fileLaporan.append("caption", `📊 REKAP LAPORAN LOGISTIK\n\nFilter Tanggal: ${filterTanggal || "Semua"}\nTotal Data: ${dataTersaring.length} pesanan.`);
      
      const respon = await fetch(`https://api.telegram.org/bot${telegramToken}/sendDocument`, { method: "POST", body: fileLaporan });
      if (respon.ok) alert("Laporan Excel berhasil dikirim ke Telegram! 🚀");
    } catch (err) { alert("Terjadi kesalahan sistem saat membuat laporan."); } 
    finally { setIsExporting(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div></div>;
  if (!session) return null;

  const dataTersaring = [...pesanan]
    .filter((item) => filterStatus === "semua" ? true : item.status_logistik === filterStatus)
    .filter((item) => {
      if (!filterTanggal) return true; 
      if (!item.created_at) return false;
      const d = new Date(item.created_at);
      const itemLocalYYYYMMDD = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return itemLocalYYYYMMDD === filterTanggal;
    })
    .sort((a, b) => {
      if (sortBy === "terdekat") return Number(a.jarak_ke_toko_km || 0) - Number(b.jarak_ke_toko_km || 0);
      return 0; 
    });

  const totalAntreanAktif = dataTersaring.filter((item) => item.status_logistik !== "selesai").length;
  const totalBeratTersaring = dataTersaring.reduce((acc, item) => acc + Number(item.berat_pesanan_kg || 0), 0);

  // GLASSMORPHISM THEME CONFIGURATION
  const dynamicBg = isDarkMode 
    ? "bg-gradient-to-br from-indigo-950 via-gray-900 to-purple-950 text-white" 
    : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 text-gray-900";
  
  const glassPanel = isDarkMode
    ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
    : "bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]";

  const glassInput = isDarkMode
    ? "bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:bg-black/40 focus:border-indigo-400"
    : "bg-white/50 border border-white/60 text-gray-900 placeholder-gray-500 focus:bg-white/80 focus:border-indigo-400";

  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-600";
  const rowHover = isDarkMode ? "hover:bg-white/5" : "hover:bg-white/50";
  const tableHeaderGlass = isDarkMode ? "bg-black/20 border-b border-white/10" : "bg-white/30 border-b border-white/40";

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 relative ${dynamicBg}`}>
      
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none"></div>

      {/* --- TOMBOL HAMBURGER MOBILE --- */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-40 p-3 rounded-xl ${glassPanel} active:scale-95`}
      >
        <span className="text-xl">☰</span>
      </button>

      {/* --- BACKDROP MOBILE (GELAP SAAT SIDEBAR BUKA) --- */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* --- SIDEBAR RESPONSIVE --- */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 flex flex-col justify-between ${glassPanel} 
        border-r border-r-white/10 md:m-4 md:rounded-3xl
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Tombol Close Mobile */}
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-white opacity-70 text-2xl font-bold">✕</button>

        <div>
          <div className="p-6 flex items-center gap-3 mt-4 md:mt-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">L</div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">LaundroAI</h2>
              <p className={`text-xs ${textMuted}`}>Logistics System</p>
            </div>
          </div>

          <nav className="mt-4 px-4 space-y-2">
            {['Dashboard', 'Tracking', 'Database Customers'].map((menu) => (
              <button 
                key={menu} 
                onClick={() => { setActiveMenu(menu); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeMenu === menu 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-white/20" 
                  : `${isDarkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-white/40'}`
                }`}
              >
                {menu === 'Dashboard' && "📊"} {menu === 'Tracking' && "📍"} {menu === 'Database Customers' && "👥"}
                <span className="text-sm">{menu}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 space-y-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all active:scale-95 text-sm font-bold ${glassPanel}`}>
            <span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span> <span>{isDarkMode ? '🌙' : '☀️'}</span>
          </button>
          <button onClick={handleLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 backdrop-blur-md">
            Keluar Sistem 🔒
          </button>
        </div>
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 pt-20 md:pt-10 scroll-smooth z-10 w-full max-w-full">
        
        {/* MODUL TRACKING */}
        {activeMenu === "Tracking" ? (
          <div className="max-w-7xl mx-auto h-full flex flex-col">
             <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">Tracking Armada 📍</h1>
                <p className={`text-sm mt-1 ${textMuted}`}>Pantau pergerakan antrean paket secara real-time.</p>
             </div>
             <div className={`flex-1 rounded-3xl overflow-hidden p-2 ${glassPanel}`}>
                {!isMapLoaded ? (
                  <div className="w-full h-full min-h-[500px] flex items-center justify-center rounded-2xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-inner">
                    <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultMapCenter} zoom={12}>
                      {dataTersaring.map((item) => {
                        if (!item.latitude || !item.longitude) return null;
                        return (
                          <Marker key={item.id} position={{ lat: item.latitude, lng: item.longitude }} onClick={() => setSelectedMarker(item)} icon={item.status_logistik === 'selesai' ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png" : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"} />
                        )
                      })}
                      {selectedMarker && (
                        <InfoWindow position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }} onCloseClick={() => setSelectedMarker(null)}>
                          <div className="p-2 text-gray-900 max-w-[200px]">
                            <h3 className="font-bold text-sm border-b pb-1 mb-1">{selectedMarker.customer_name}</h3>
                            <p className="text-xs mb-1">📍 {selectedMarker.alamat_detail}</p>
                            <p className="text-xs font-bold text-indigo-600">Status: {selectedMarker.status_logistik.toUpperCase()}</p>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </div>
                )}
             </div>
          </div>

        // MODUL DATABASE
        ) : activeMenu === "Database Customers" ? (
          <div className="max-w-7xl mx-auto overflow-x-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Database Pelanggan 👥</h1>
                <p className={`text-sm mt-1 ${textMuted}`}>Kelola profil pelanggan untuk fitur Autofill.</p>
              </div>
              <button onClick={() => setIsCustomerModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/30 border border-white/20 transition-all active:scale-95 flex items-center gap-2">
                ➕ <span>Customer Baru</span>
              </button>
            </div>

            {customers.length === 0 ? (
              <div className={`rounded-3xl p-16 text-center ${glassPanel}`}>
                <div className="text-5xl mb-4 opacity-50">📂</div>
                <h3 className="text-xl font-bold mb-2">Database Kosong</h3>
                <p className={textMuted}>Klik tombol di atas untuk menambah profil.</p>
              </div>
            ) : (
              <div className={`rounded-3xl overflow-x-auto ${glassPanel}`}>
                <table className="min-w-full text-left">
                  <thead className={tableHeaderGlass}>
                    <tr>
                      <th className="p-5 font-semibold text-sm tracking-wide">Nama Pelanggan</th>
                      <th className="p-5 font-semibold text-sm tracking-wide">Alamat Default</th>
                      <th className="p-5 font-semibold text-sm tracking-wide">Jarak</th>
                      <th className="p-5 font-semibold text-sm tracking-wide">Koordinat Maps</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-black/5'}`}>
                    {customers.map((c) => (
                      <tr key={c.id} className={`transition-colors ${rowHover}`}>
                        <td className="p-5 font-bold whitespace-nowrap">{c.name}</td>
                        <td className="p-5 text-sm min-w-[200px]">{c.alamat_detail}</td>
                        <td className="p-5 font-bold text-indigo-400 whitespace-nowrap">{c.jarak_ke_toko_km} km</td>
                        <td className="p-5 text-sm font-mono opacity-80 whitespace-nowrap">{c.latitude}, {c.longitude}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        // MODUL DASHBOARD UTAMA
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Ringkasan Operasional</h1>
                <p className={`text-sm mt-1 ${textMuted}`}>Pantau pergerakan kurir dan selesaikan pesanan.</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 border border-white/20 transition-all active:scale-95 flex items-center gap-2">
                ➕ <span>Pesanan Baru</span>
              </button>
            </div>

            {/* METRIK KARTU KACA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className={`p-6 rounded-3xl ${glassPanel} border-t-4 border-t-yellow-400`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Antrean Aktif</h3>
                <p className="text-4xl font-extrabold mt-3">{totalAntreanAktif}</p>
              </div>
              <div className={`p-6 rounded-3xl ${glassPanel} border-t-4 border-t-blue-500`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Total Berat</h3>
                <p className="text-4xl font-extrabold mt-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">{totalBeratTersaring.toFixed(1)} <span className="text-lg font-medium text-gray-400">kg</span></p>
              </div>
              <div className={`p-6 rounded-3xl ${glassPanel} border-t-4 border-t-green-500`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Selesai</h3>
                <p className="text-4xl font-extrabold mt-3">{dataTersaring.length - totalAntreanAktif}</p>
              </div>
            </div>

            {/* AREA FILTER */}
            <div className="flex flex-col xl:flex-row justify-between mb-6 gap-4">
              <div className="flex gap-3 flex-wrap">
                <div className={`flex p-1 rounded-xl w-fit ${glassPanel}`}>
                  {["semua", "pickup", "selesai"].map((s) => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${filterStatus === s ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100"}`}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className={`flex items-center gap-2 px-4 py-1 rounded-xl ${glassPanel}`}>
                  <span className="text-sm font-bold opacity-60">📅</span>
                  <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className={`text-xs md:text-sm font-bold outline-none bg-transparent cursor-pointer`} style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                  {filterTanggal && <button onClick={() => setFilterTanggal("")} className="text-red-400 hover:text-red-500 ml-1 text-xs font-bold transition-colors">✕</button>}
                </div>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <div className={`flex p-1 rounded-xl ${glassPanel}`}>
                  <button onClick={() => setSortBy("terbaru")} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${sortBy === "terbaru" ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100"}`}>⏱️ Terbaru</button>
                  <button onClick={() => setSortBy("terdekat")} className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${sortBy === "terdekat" ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100"}`}>📍 Terdekat</button>
                </div>
                <button onClick={generateDanKirimLaporan} disabled={isExporting} className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${glassPanel} hover:bg-white/10`}>
                  {isExporting ? "⏳ Ekspor..." : "📊 Excel"}
                </button>
                <div className={`flex p-1 rounded-xl hidden md:flex ${glassPanel}`}>
                  <button onClick={() => setViewMode("table")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "table" ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100"}`}>TABEL</button>
                  <button onClick={() => setViewMode("grid")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "grid" ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100"}`}>GRID</button>
                </div>
              </div>
            </div>

            {/* AREA RENDER DATA KACA */}
            {dataTersaring.length === 0 ? (
              <div className={`rounded-3xl p-16 text-center ${glassPanel}`}>
                <div className="text-5xl mb-4 opacity-50">📭</div>
                <h3 className="text-xl font-bold mb-2">Tidak ada aktivitas</h3>
                <p className={textMuted}>Belum ada data pesanan pada tanggal atau filter ini.</p>
              </div>
            ) : viewMode === "table" ? (
              <div className={`rounded-3xl overflow-x-auto ${glassPanel}`}>
                <table className="min-w-full text-left">
                  <thead className={tableHeaderGlass}>
                    <tr>
                      <th className="p-5 font-semibold text-sm tracking-wide">ID & Pelanggan</th>
                      <th className="p-5 font-semibold text-sm tracking-wide">Alamat Tujuan</th>
                      <th className="p-5 font-semibold text-sm tracking-wide">Jarak & Beban</th>
                      <th className="p-5 font-semibold text-sm tracking-wide text-center">Status SLA</th>
                      <th className="p-5 font-semibold text-sm tracking-wide text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-black/5'}`}>
                    {dataTersaring.map((item) => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="p-5 min-w-[150px]">
                          <div className="text-xs font-bold mb-1 opacity-60">#{item.id}</div>
                          <div className="font-bold">{item.customer_name}</div>
                          <div className={`text-xs mt-1 font-medium ${textMuted}`}>
                            {item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"} WIB
                          </div>
                        </td>
                        <td className="p-5 min-w-[200px]">
                          <div className="text-sm opacity-80">{item.alamat_detail}</div>
                        </td>
                        <td className="p-5 min-w-[120px]">
                          <div className="font-bold text-indigo-400">{item.jarak_ke_toko_km} <span className="text-xs text-black/50 dark:text-white/50">km</span></div>
                          <div className={`text-sm mt-1 ${textMuted}`}>{item.berat_pesanan_kg} kg</div>
                        </td>
                        <td className="p-5 text-center align-middle min-w-[150px]">
                          <span className={`px-3 py-1.5 font-bold rounded-lg text-[11px] tracking-wider uppercase block w-max mx-auto ${item.status_logistik === 'selesai' ? 'bg-green-500/20 text-green-500 dark:text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'}`}>
                            {item.status_logistik}
                          </span>
                          {item.status_logistik !== 'selesai' && (
                            <div className={`mt-2 text-[11px] font-bold px-2 py-1 rounded-md w-max mx-auto border flex items-center gap-1 bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20`}>
                              <span className="animate-pulse">⏳</span> {hitungWaktuTunggu(item.created_at)}
                            </div>
                          )}
                        </td>
                        <td className="p-5 text-center align-middle min-w-[150px]">
                          {item.status_logistik !== 'selesai' ? (
                            <button onClick={() => bukaModalFoto(item.id, item.customer_name)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg transition-all active:scale-95 whitespace-nowrap border border-white/20">Kirim Paket 🚀</button>
                          ) : (
                            <button onClick={() => lihatFotoBukti(item.id)} className={`text-xs font-bold px-3 py-2 rounded-lg transition-all ${glassPanel} hover:bg-white/10`}>👁️ Cek Foto</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataTersaring.map((item) => (
                  <div key={item.id} className={`p-6 rounded-3xl relative ${glassPanel}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs font-bold mb-1 opacity-60">#{item.id}</div>
                        <h4 className="text-xl font-bold">{item.customer_name}</h4>
                      </div>
                      <span className={`px-3 py-1 font-bold rounded-lg text-[10px] tracking-wider uppercase ${item.status_logistik === 'selesai' ? 'bg-green-500/20 text-green-500 dark:text-green-400' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'}`}>
                        {item.status_logistik}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3">
                        <span className="opacity-50">📍</span>
                        <p className="text-sm opacity-80">{item.alamat_detail}</p>
                      </div>
                      <div className="flex justify-between items-center bg-black/10 dark:bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="font-bold">🛵 {item.jarak_ke_toko_km} <span className="text-xs opacity-50 font-normal">km</span></div>
                        <div className="w-[1px] h-4 bg-black/20 dark:bg-white/20"></div>
                        <div className="font-bold">📦 {item.berat_pesanan_kg} <span className="text-xs opacity-50 font-normal">kg</span></div>
                      </div>
                      
                      <div className={`flex justify-between items-center text-xs font-medium ${textMuted}`}>
                        <span>🕒 {item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"} WIB</span>
                        {item.status_logistik !== 'selesai' && (
                          <span className={`font-bold px-2 py-1 rounded border flex items-center gap-1 bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20`}>
                            <span className="animate-pulse">⏳</span> {hitungWaktuTunggu(item.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {item.status_logistik !== 'selesai' ? (
                      <button onClick={() => bukaModalFoto(item.id, item.customer_name)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg border border-white/20">Kirim Paket 🚀</button>
                    ) : (
                      <button onClick={() => lihatFotoBukti(item.id)} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${glassPanel} hover:bg-white/10`}>👁️ Cek Foto Bukti</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- SEMUA MODAL POP-UP DIUBAH MENJADI KACA --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl w-full max-w-md overflow-visible ${glassPanel} border-white/20 shadow-2xl`}>
            <div className="bg-white/10 border-b border-white/10 p-5 flex justify-between items-center rounded-t-3xl">
              <h2 className="font-bold text-lg">➕ Buat Pesanan Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="opacity-70 hover:opacity-100 text-2xl">×</button>
            </div>
            <form onSubmit={handleTambahPesanan} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="relative">
                <label className="block text-sm font-bold mb-1 opacity-80">Nama Pelanggan (Autofill)</label>
                <input type="text" required value={formData.customer_name} onChange={(e) => { setFormData({...formData, customer_name: e.target.value}); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className={`w-full py-3 px-4 rounded-xl outline-none transition-all ${glassInput}`} placeholder="Mulai ketik nama..." />
                
                {showSuggestions && formData.customer_name && customers.filter(c => c.name.toLowerCase().includes(formData.customer_name.toLowerCase())).length > 0 && (
                  <ul className={`absolute z-50 w-full mt-2 rounded-xl max-h-48 overflow-y-auto backdrop-blur-2xl bg-gray-900/80 border border-white/10 shadow-2xl text-white`}>
                    {customers.filter(c => c.name.toLowerCase().includes(formData.customer_name.toLowerCase())).map(c => (
                      <li key={c.id} onClick={() => { setFormData({...formData, customer_name: c.name, alamat_detail: c.alamat_detail, jarak_ke_toko_km: c.jarak_ke_toko_km, latitude: c.latitude, longitude: c.longitude}); setShowSuggestions(false); }} className={`px-4 py-3 cursor-pointer text-sm font-bold border-b border-white/5 last:border-b-0 hover:bg-white/10 transition-colors`}>
                        {c.name} <span className="block text-xs font-normal opacity-60 truncate">{c.alamat_detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div><label className="block text-sm font-bold mb-1 opacity-80">Alamat Lengkap</label><textarea required value={formData.alamat_detail} onChange={(e) => setFormData({...formData, alamat_detail: e.target.value})} className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${glassInput}`} rows={2}></textarea></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1 opacity-80">Jarak (KM)</label><input type="number" step="0.1" required value={formData.jarak_ke_toko_km} onChange={(e) => setFormData({...formData, jarak_ke_toko_km: e.target.value})} className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${glassInput}`} /></div>
                <div><label className="block text-sm font-bold mb-1 opacity-80">Berat (KG)</label><input type="number" step="0.1" required value={formData.berat_pesanan_kg} onChange={(e) => setFormData({...formData, berat_pesanan_kg: e.target.value})} className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${glassInput}`} /></div>
              </div>
              
              <div className="border-t border-white/10 pt-4 mt-2">
                <label className="block text-sm font-bold mb-3 text-indigo-500 dark:text-indigo-400">📍 Koordinat Maps</label>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold mb-1 opacity-70">Latitude</label><input type="number" step="any" required value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition-all ${glassInput}`} /></div>
                  <div><label className="block text-xs font-bold mb-1 opacity-70">Longitude</label><input type="number" step="any" required value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition-all ${glassInput}`} /></div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 font-bold py-3 rounded-xl transition-all bg-black/10 hover:bg-black/20 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10`}>Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 border border-white/20 shadow-lg text-white">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl w-full max-w-md overflow-hidden ${glassPanel} border-white/20 shadow-2xl`}>
            <div className="bg-white/10 border-b border-white/10 p-5 flex justify-between items-center rounded-t-3xl">
              <h2 className="font-bold text-lg">👥 Tambah Customer</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="opacity-70 hover:opacity-100 text-2xl">×</button>
            </div>
            <form onSubmit={handleTambahCustomer} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div><label className="block text-sm font-bold mb-1 opacity-80">Nama Lengkap</label><input type="text" required value={customerFormData.name} onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value})} className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${glassInput}`} /></div>
              <div><label className="block text-sm font-bold mb-1 opacity-80">Alamat Default</label><textarea required value={customerFormData.alamat_detail} onChange={(e) => setCustomerFormData({...customerFormData, alamat_detail: e.target.value})} className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${glassInput}`} rows={2}></textarea></div>
              <div><label className="block text-sm font-bold mb-1 opacity-80">Jarak Default (KM)</label><input type="number" step="0.1" required value={customerFormData.jarak_ke_toko_km} onChange={(e) => setCustomerFormData({...customerFormData, jarak_ke_toko_km: e.target.value})} className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${glassInput}`} /></div>
              
              <div className="border-t border-white/10 pt-4 mt-2">
                <label className="block text-sm font-bold mb-3 text-purple-500 dark:text-purple-400">📍 Titik Koordinat Rumah</label>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold mb-1 opacity-70">Latitude</label><input type="number" step="any" required value={customerFormData.latitude} onChange={(e) => setCustomerFormData({...customerFormData, latitude: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition-all ${glassInput}`} /></div>
                  <div><label className="block text-xs font-bold mb-1 opacity-70">Longitude</label><input type="number" step="any" required value={customerFormData.longitude} onChange={(e) => setCustomerFormData({...customerFormData, longitude: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition-all ${glassInput}`} /></div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className={`flex-1 font-bold py-3 rounded-xl transition-all bg-black/10 hover:bg-black/20 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10`}>Batal</button>
                <button type="submit" disabled={isSubmittingCustomer} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg border border-white/20 text-white">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KAMERA BUKTI PENGIRIMAN */}
      {isPhotoModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl w-full max-w-sm overflow-hidden ${glassPanel} border-white/20 shadow-2xl text-white`}>
            <div className="bg-white/10 border-b border-white/10 p-5 flex justify-between items-center">
              <h2 className="font-bold text-lg">📸 Bukti Sampai</h2>
              <button onClick={() => setIsPhotoModalOpen(false)} className="opacity-70 hover:opacity-100 text-2xl">×</button>
            </div>
            <form onSubmit={kirimBuktiSelesai} className="p-6 text-center">
              <p className={`mb-6 text-sm text-gray-300`}>Upload foto tiba di lokasi <strong>{selectedOrder.customer_name}</strong></p>
              
              {livePreviewUrl ? (
                <div className="mb-6 w-full aspect-square bg-black/20 rounded-2xl overflow-hidden border border-white/20 flex items-center justify-center relative group">
                  <img src={livePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-bold text-sm">Ganti Foto</span>
                  </div>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePilihFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              ) : (
                <div className="mb-6 w-full aspect-square bg-white/5 rounded-2xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-indigo-400 hover:bg-white/10 transition-colors relative cursor-pointer">
                  <span className="text-4xl mb-2">📱</span>
                  <span className="font-bold text-sm">Ketuk Kamera</span>
                  <input type="file" accept="image/*" capture="environment" required onChange={handlePilihFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              )}

              <button type="submit" disabled={isUploadingPhoto || !deliveryPhoto} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg border border-white/20">
                {isUploadingPhoto ? "🚀 Memproses..." : "Kirim & Selesai"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-lg relative flex flex-col items-center">
            <button onClick={() => setIsPreviewOpen(false)} className="absolute -top-12 right-0 text-white opacity-60 hover:opacity-100 font-bold text-3xl">×</button>
            <h3 className="text-white font-bold mb-4 opacity-80 tracking-widest text-sm">BUKTI PENGIRIMAN</h3>
            <div className="w-full aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
              <img src={previewTargetUrl} alt="Bukti Terupload" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}