"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import Swal from "sweetalert2"; // 🚀 IMPORT SWEETALERT2 DISINI

// KONFIGURASI SUPABASE & TELEGRAM
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const telegramToken = process.env.NEXT_PUBLIC_TELEGRAM_TOKEN as string; 
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID as string; 
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const defaultMapCenter = { lat: -6.2088, lng: 106.8456 }; 
const mapContainerStyle = { width: "100%", height: "600px", borderRadius: "16px" };

export default function Dashboard() {
  const router = useRouter();

  const [isProfileScreen, setIsProfileScreen] = useState(true);
  const [profilePinModal, setProfilePinModal] = useState({ isOpen: false, role: "" });
  const [profilePinInput, setProfilePinInput] = useState("");
  const [storePins, setStorePins] = useState({ owner: "111111", kasir: "123456" });

  // STATE DATABASE
  const [pesanan, setPesanan] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]); 
  const [pengeluaran, setPengeluaran] = useState<any[]>([]); 
  const [auditLogs, setAuditLogs] = useState<any[]>([]); 

  const [session, setSession] = useState<any>(null); 
  const [loading, setLoading] = useState(true); 
  
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  // ==========================================
  // LOGIKA MENGINGAT POSISI MENU SAAT REFRESH
  // ==========================================
  useEffect(() => {
    const savedMenu = localStorage.getItem("laundro_active_menu");
    if (savedMenu) {
      const secureMenus = ["Calendar", "Pengeluaran", "Data Log"];
      const isUnlocked = sessionStorage.getItem("laundro_secure_unlocked") === "true";
      
      if (secureMenus.includes(savedMenu) && !isUnlocked) {
        setActiveMenu("Dashboard");
      } else {
        setActiveMenu(savedMenu);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("laundro_active_menu", activeMenu);
  }, [activeMenu]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // STATE KEAMANAN (SECURITY LOCK)
  const [isSecureUnlocked, setIsSecureUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isNominalHidden, setIsNominalHidden] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [namaToko, setNamaToko] = useState("");
  const [kontakToko, setKontakToko] = useState("");
  const [isUpdatingToko, setIsUpdatingToko] = useState(false);
  const [inputKodeToko, setInputKodeToko] = useState("");
  const [kasirId, setKasirId] = useState<string | null>(null);
  const [filterTanggalInventory, setFilterTanggalInventory] = useState<string>("");
  const [selectedDateDetails, setSelectedDateDetails] = useState<any>(null);
  const [inputPin, setInputPin] = useState("");
  const [pendingMenu, setPendingMenu] = useState("");
  
  const [sortBy, setSortBy] = useState<"terbaru" | "terdekat">("terbaru");
  const [filterTanggal, setFilterTanggal] = useState<string>(() => {
     const d = new Date();
     return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
   }); 
  const [filterTanggalPengeluaran, setFilterTanggalPengeluaran] = useState<string>("");

  // STATE KALENDER PENDAPATAN
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  // State khusus untuk Modal Pelunasan
  const [isLunasModalOpen, setIsLunasModalOpen] = useState(false);
  const [orderYangDilunasi, setOrderYangDilunasi] = useState<any>(null);
  const [fileBuktiLunas, setFileBuktiLunas] = useState<File | null>(null);
  const [isSubmittingLunas, setIsSubmittingLunas] = useState(false);

  // ==========================================
  // STATE INVENTARIS GUDANG (TERHUBUNG SUPABASE)
  // ==========================================
  const [inventory, setInventory] = useState({ deterjen: 0, parfum: 0, plastik: 0 });

  // STATE PENGELUARAN BARU
  const [formPengeluaran, setFormPengeluaran] = useState({ kategori: "Listrik (Token/Pasca)", deskripsi: "", nominal: "" });
  const [fotoStruk, setFotoStruk] = useState<File | null>(null);
  const [previewStrukUrl, setPreviewStrukUrl] = useState<string | null>(null);

  // STATE FORM & POS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false); 
  
  const [paymentPhoto, setPaymentPhoto] = useState<File | null>(null);
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState<string | null>(null);
  
  const defaultRincian = { "👕": 0, "👖": 0, "👔": 0, "🧥": 0, "🩲": 0, "🧦": 0, "🧣": 0 };
  const [rincianItem, setRincianItem] = useState(defaultRincian);

  const [formData, setFormData] = useState({ 
    customer_name: "", alamat_detail: "", jarak_ke_toko_km: "", berat_pesanan_kg: "", latitude: "", longitude: "",
    tipe_layanan: "kiloan", 
    paket_layanan: "Cuci Kering Setrika Lipat",
    metode_pengiriman: "Diantar Driver Internal",
    status_pembayaran: "Lunas", 
    jumlah_dp: "0",
    harga_per_unit: "7000", 
    total_harga: 0
  });

  const [detailPesanan, setDetailPesanan] = useState<any>(null);

  useEffect(() => {
    let jumlah = 0;
    if (formData.tipe_layanan === "satuan") {
      jumlah = Object.values(rincianItem).reduce((a, b) => a + b, 0);
      setFormData(prev => ({ ...prev, berat_pesanan_kg: jumlah.toString() }));
    } else {
      jumlah = Number(formData.berat_pesanan_kg) || 0; 
    }
    const harga = Number(formData.harga_per_unit) || 0;
    setFormData(prev => ({ ...prev, total_harga: jumlah * harga }));
  }, [formData.berat_pesanan_kg, formData.harga_per_unit, formData.tipe_layanan, rincianItem]);

  const handleRincianChange = (item: keyof typeof rincianItem, delta: number) => {
    setRincianItem(prev => {
      const newValue = prev[item] + delta;
      return { ...prev, [item]: Math.max(0, newValue) }; 
    });
  };

  function handlePilihFotoPembayaran(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setPaymentPhoto(file);
    if (file) setPaymentPreviewUrl(URL.createObjectURL(file));
    else setPaymentPreviewUrl(null);
  }

  function handlePilihFotoStruk(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFotoStruk(file);
    if (file) setPreviewStrukUrl(URL.createObjectURL(file));
    else setPreviewStrukUrl(null);
  }

  // FUNGSI 1: MENCATAT AKTIVITAS KE DATABASE
  const catatLog = async (aksi: string, detail: string) => {
    try {
      // Ambil nama kasir dan ID toko dari session (Sesuaikan dengan key milik Anda)
      const kasir = sessionStorage.getItem("laundro_user_name") || "Admin/Sistem"; 
      const storeId = sessionStorage.getItem("laundro_store_id");

      if (!storeId) return;

      await supabase.from("audit_logs").insert([
        {
          store_id: storeId,
          nama_kasir: kasir,
          aksi: aksi,
          detail: detail,
        }
      ]);
    } catch (error) {
      console.error("Gagal mencatat log:", error);
    }
  };

  const handleMenuClick = (menu: string) => {
    const secureMenus = ["Calendar", "Pengeluaran", "Data Log"];
    if (secureMenus.includes(menu) && !isSecureUnlocked) {
      setPendingMenu(menu);
      setIsPinModalOpen(true);
      setIsSidebarOpen(false);
    } else {
      setActiveMenu(menu);
      setIsSidebarOpen(false);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === SECURITY_PIN) {
      setIsSecureUnlocked(true);
      sessionStorage.setItem("laundro_secure_unlocked", "true"); 
      setIsPinModalOpen(false);
      setActiveMenu(pendingMenu);
      setInputPin("");
      catatLog("Security Unlock", `Berhasil membuka menu terkunci (${pendingMenu})`);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'PIN Salah! Silakan coba lagi.'
      });
      setInputPin("");
      catatLog("Security Breach", `Percobaan akses ilegal ke menu ${pendingMenu} dengan PIN yang salah.`);
    }
  };

  const KANBAN_COLUMNS = ["Antrean", "Sedang Dicuci", "Disetrika", "Packing", "Siap Kirim", "selesai"];

  const perbaruiStatusPesanan = async (id: number, newStatus: string) => {
    const orderLama = pesanan.find(p => p.id === id);
    if (!orderLama) return;

    if ((newStatus === "Siap Kirim" || newStatus === "selesai") && orderLama.status_pembayaran !== "Lunas") {
       Swal.fire({
         icon: 'warning',
         title: 'Akses Diblokir 🛑',
         text: `Pesanan Pelanggan "${orderLama.customer_name}" berstatus [${orderLama.status_pembayaran}]. Selesaikan pelunasan kasir terlebih dahulu sebelum lanjut kirim baju!`
       });
       return;
    }

    if (newStatus === "selesai") {
      bukaModalFoto(id, orderLama.customer_name);
      return; 
    }

    setPesanan(prev => prev.map(p => p.id === id ? { ...p, status_logistik: newStatus } : p));
    const { error } = await supabase.from("orders").update({ status_logistik: newStatus }).eq("id", id);
    
    if (error) { 
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status!' });
      ambilData(); 
      return; 
    }

    catatLog("Update Status", `Pesanan #${id} (${orderLama.customer_name}) dipindah ke [${newStatus}]`);
    if (newStatus === "Siap Kirim" && orderLama.status_logistik !== "Siap Kirim") kirimNotifSiapKirim(orderLama);
  };

  const lunasiPesananInstant = async (id: number) => {
    setPesanan(prev => prev.map(p => p.id === id ? { ...p, status_pembayaran: "Lunas" } : p));
    if(detailPesanan && detailPesanan.id === id) setDetailPesanan((prev: any) => ({ ...prev, status_pembayaran: "Lunas" }));
    
    const { error } = await supabase.from("orders").update({ status_pembayaran: "Lunas" }).eq("id", id);
    if (error) { 
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal melunasi transaksi!' });
      ambilData(); 
    } else { 
      catatLog("Pelunasan", `Kasir melunasi pesanan #${id} secara instan di papan operasional.`);
      Swal.fire({
        icon: 'success',
        title: 'LUNAS 🎉',
        text: 'Pembayaran dikonfirmasi! Papan operasional terbuka kembali.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const kirimNotifSiapKirim = async (order: any) => {
    let teksNotif = `✨ *HALO ${order.customer_name}* ✨\n\nCucian kamu (Nota #${order.id}) sudah berstatus *Siap Kirim/Selesai*! Terima kasih! 🙏`;
    fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: teksNotif, parse_mode: "Markdown" })
    }).catch(console.error);
  };

  

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ name: "", alamat_detail: "", jarak_ke_toko_km: "" });
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [buktiFotoUrls, setBuktiFotoUrls] = useState<{[key: number]: string}>({});
  const [previewTargetUrl, setPreviewTargetUrl] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false); 
  const { isLoaded: isMapLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  useEffect(() => {
    async function cekKeamanan() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setSession(session);

      let { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single();

      if (profile) {
        sessionStorage.setItem("laundro_store_id", profile.store_id);
        
        // 💡 AMBIL DATA TOKO BESERTA PIN
        const { data: storeData } = await supabase.from("stores").select("*").eq("id", profile.store_id).single();
        if (storeData) {
          setNamaToko(storeData.name || "");
          setKontakToko(storeData.contact || "");
          setStorePins({ 
            owner: storeData.pin_owner || "111111", 
            kasir: storeData.pin_kasir || "123456" 
          });
        }

      const savedProfile = sessionStorage.getItem("laundro_active_profile");
        if (savedProfile) {
          setIsProfileScreen(false);
          setIsOwnerMode(savedProfile === "owner");
        }
      }

      if (profile) {
        sessionStorage.setItem("laundro_store_id", profile.store_id);
        setIsOwnerMode(profile.role === "owner");
        
        const { data: storeData } = await supabase.from("stores").select("name, contact").eq("id", profile.store_id).single();
        if (storeData) {
          setNamaToko(storeData.name || "");
          setKontakToko(storeData.contact || "");
        }
      }

      const isPinUnlocked = sessionStorage.getItem("laundro_secure_unlocked");
      if (isPinUnlocked === "true") {
        setIsSecureUnlocked(true);
      }

      ambilData(); 
      setLoading(false);
    }
    
    cekKeamanan();
  }, [router]);

      // FUNGSI 2: MENGAMBIL DATA LOG UNTUK DITAMPILKAN DI LAYAR
  const ambilAuditLogs = async () => {
    const storeId = sessionStorage.getItem("laundro_store_id");
    if (!storeId) return;

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(100); // Ambil 100 aktivitas terbaru agar tidak berat

    if (data && !error) {
      setAuditLogs(data);
    }
  };

  useEffect(() => {
    const kickListener = supabase.channel('radar-pemecatan')
      .on(
        'postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'user_profiles' }, 
        async (payload) => {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && payload.old && payload.old.id === session.user.id) {
            await Swal.fire({
              icon: 'warning',
              title: 'AKSES DICABUT ⚠️',
              text: 'Anda telah dikeluarkan dari Toko oleh Owner.',
              confirmButtonText: 'Keluar'
            });
            
            sessionStorage.removeItem("laundro_store_id");
            sessionStorage.removeItem("laundro_secure_unlocked");
            localStorage.removeItem("laundro_active_menu");
            await supabase.auth.signOut();
            
            window.location.href = "/login";
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kickListener);
    };
  }, []);

  useEffect(() => {
    const storeId = sessionStorage.getItem("laundro_store_id");
    if (!storeId) return;

    const realtimeSync = supabase.channel('realtime-sync')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, 
        (payload) => {
          // Auto-refresh data jika ada perubahan di tabel orders
          ambilData();
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory', filter: `store_id=eq.${storeId}` }, 
        (payload) => {
          // Auto-refresh data jika stok gudang berubah
          ambilData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeSync);
    };
  }, []);

    // Panggil fungsi ambilAuditLogs saat masuk ke menu Audit Log
  useEffect(() => {
    if (activeMenu === "Data Log") { // 💡 UBAH DI SINI
      ambilAuditLogs();
    }
  }, [activeMenu]);

  async function ambilData() {
    const storeId = sessionStorage.getItem("laundro_store_id");
    if (!storeId) return; 

    const { data: ordersData } = await supabase.from("orders").select("*").eq("store_id", storeId).order("id", { ascending: false });
    if (Array.isArray(ordersData)) setPesanan(ordersData);
    
    const { data: customersData } = await supabase.from("customers").select("*").eq("store_id", storeId).order("name", { ascending: true });
    if (Array.isArray(customersData)) setCustomers(customersData);

    const { data: expData } = await supabase.from("expenses").select("*").eq("store_id", storeId).order("id", { ascending: false });
    if (Array.isArray(expData)) setPengeluaran(expData);

    const { data: logData } = await supabase.from("audit_logs").select("*").eq("store_id", storeId).order("id", { ascending: false }).limit(300);
    if (Array.isArray(logData)) setAuditLogs(logData);

    const { data: invData } = await supabase.from("inventory").select("*").eq("store_id", storeId).maybeSingle();
    if (invData) {
      setInventory({ deterjen: invData.deterjen, parfum: invData.parfum, plastik: invData.plastik });
    }
  }

  // Fungsi dipanggil saat tombol "Lunasi" diklik
  const bukaModalLunasi = (order: any) => {
    setOrderYangDilunasi(order);
    setFileBuktiLunas(null);
    setIsLunasModalOpen(true);
  };

  // Fungsi untuk mengunggah bukti dan mengubah status ke Lunas
  const handleSubmitPelunasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderYangDilunasi || !fileBuktiLunas) {
      alert("Harap lampirkan foto/file bukti transaksi!");
      return;
    }

    setIsSubmittingLunas(true);
    try {
      // 1. Upload File ke Supabase Storage (Pastikan Anda sudah membuat bucket 'bukti-transaksi' di Supabase)
      const fileExt = fileBuktiLunas.name.split('.').pop();
      const fileName = `lunas_${orderYangDilunasi.id}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bukti-transaksi') // Ganti jika nama bucket Anda berbeda
        .upload(fileName, fileBuktiLunas);

      if (uploadError) throw uploadError;

      // 2. Dapatkan URL Publik dari foto yang diupload
      const { data: publicUrlData } = supabase.storage
        .from('bukti-transaksi')
        .getPublicUrl(fileName);

      // 3. Update tabel orders: ubah status dan simpan link foto
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status_pembayaran: 'Lunas', // Sesuaikan dengan value kolom Anda
          bukti_pembayaran: publicUrlData.publicUrl // Pastikan kolom ini ada di database
        })
        .eq('id', orderYangDilunasi.id);

      if (updateError) throw updateError;

      // 4. Sukses
      setIsLunasModalOpen(false);
      setFileBuktiLunas(null);
      ambilData(); // Refresh data layar agar tombol berubah
      
    } catch (error: any) {
      console.error("Error pelunasan:", error);
      alert("Gagal memproses pelunasan: " + error.message);
    } finally {
      setIsSubmittingLunas(false);
    }
  };

  const handleKlikTanggal = (day: any) => {
    if (day.qty === 0 && day.total === 0) return; 
    const pengeluaranHariIni = pengeluaran.filter(p => {
      if(!p.created_at) return false;
      const d = new Date(p.created_at);
      return d.getDate() === day.tanggal && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
    });

    const totalPengeluaranHariIni = pengeluaranHariIni.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

    setSelectedDateDetails({
      tanggal: day.tanggal,
      jumlahTransaksi: day.qty,
      totalIncome: day.total,
      totalPengeluaran: totalPengeluaranHariIni,
      listPengeluaran: pengeluaranHariIni
    });
    
    setIsCalendarModalOpen(true);
  };

  const unduhExcel = () => {
    const dataUntukDiunduh = filterTanggal 
      ? pesanan.filter((p: any) => p.created_at && p.created_at.includes(filterTanggal))
      : pesanan;

    if (dataUntukDiunduh.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Data Kosong',
        text: 'Tidak ada data pesanan di tanggal tersebut untuk diunduh!'
      });
      return;
    }

    let isiCSV = "ID Pesanan,Tanggal,Nama Pelanggan,Paket Layanan,Total Harga,Status Pembayaran\n";
    
    dataUntukDiunduh.forEach((p: any) => {
      const tanggalFormat = new Date(p.created_at || p.createdAt).toLocaleDateString('id-ID');
      isiCSV += `"${p.id || p.order_id}","${tanggalFormat}","${p.customer_name}","${p.paket_layanan}","Rp ${p.total_harga}","${p.status_pembayaran}"\n`;
    });

    const blob = new Blob([isiCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Laundry_${filterTanggal || "Semua_Waktu"}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function bukaPengaturan() {
    setIsSettingsOpen(true);
    if (isOwnerMode) {
      const storeId = sessionStorage.getItem("laundro_store_id");
      const { data } = await supabase.from("user_profiles").select("id").eq("store_id", storeId).eq("role", "kasir").maybeSingle();
      setKasirId(data ? data.id : null);
    }
  }

  async function handlePecatKasir() {
    const result = await Swal.fire({
      title: 'PERINGATAN ⚠️',
      text: "Yakin ingin mencabut akses kasir saat ini? Pegawai tersebut akan langsung dikeluarkan dari toko Anda.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Cabut Akses',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed || !kasirId) return;

    try {
      await supabase.from("user_profiles").delete().eq("id", kasirId);
      Swal.fire('Berhasil!', 'Akses pegawai berhasil dicabut. Slot kasir sekarang kosong.', 'success');
      setKasirId(null);
    } catch (err: any) {
      Swal.fire('Error', "Gagal mencabut akses: " + err.message, 'error');
    }
  }

  async function handleSimpanProfilToko(e: React.FormEvent) {
  e.preventDefault();
  setIsUpdatingToko(true);
  const storeId = sessionStorage.getItem("laundro_store_id");
  
  try {
    const { error } = await supabase.from("stores").update({ 
      name: namaToko, 
      contact: kontakToko,
      pin_owner: storePins.owner, // <--- PIN Owner yang baru
      pin_kasir: storePins.kasir  // <--- PIN Kasir yang baru
    }).eq("id", storeId);
    
    if (error) throw error;
    
    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Profil Toko dan PIN Keamanan Berhasil Diperbarui!',
      timer: 3000,
      showConfirmButton: false
    });
  } catch (err: any) {
    Swal.fire('Gagal', "Gagal menyimpan profil toko: " + err.message, 'error');
  } finally {
    setIsUpdatingToko(false);
  }
}

  async function handleGabungToko(e: React.FormEvent) {
    e.preventDefault();
    if (!inputKodeToko) return;
    
    const result = await Swal.fire({
      title: 'Konfirmasi Bergabung',
      text: 'Apakah Anda yakin ingin bergabung ke Toko ini? Data toko Anda yang kosong saat ini akan ditinggalkan.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Gabung!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cekAkun } = await supabase.from("user_profiles").select("id").eq("store_id", inputKodeToko);
      if (cekAkun && cekAkun.length >= 2) {
        Swal.fire('Gagal', 'Toko ini sudah mencapai batas maksimal (2 Akun).', 'error');
        return;
      }

      const { error } = await supabase.from("user_profiles").update({ 
        store_id: inputKodeToko, 
        role: "kasir" 
      }).eq("id", session.user.id);

      if (error) throw new Error(error.message);

      await Swal.fire('Berhasil!', 'Berhasil bergabung sebagai Kasir! Sistem akan dimuat ulang.', 'success');
      sessionStorage.setItem("laundro_store_id", inputKodeToko);
      window.location.reload(); 
      
    } catch (err: any) {
      Swal.fire('Gagal', "Gagal bergabung: " + err.message, 'error');
    }
  }

  const handleSelectProfile = (role: string) => {
    setProfilePinModal({ isOpen: true, role });
    setProfilePinInput("");
  };

  const handleVerifyProfilePin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = profilePinModal.role === "owner" ? storePins.owner : storePins.kasir;
    
    if (profilePinInput === correctPin) {
      setIsProfileScreen(false);
      setIsOwnerMode(profilePinModal.role === "owner");
      sessionStorage.setItem("laundro_active_profile", profilePinModal.role);
      setProfilePinModal({ isOpen: false, role: "" });
      catatLog("Login Profile", `${profilePinModal.role.toUpperCase()} masuk ke sistem.`);
    } else {
      Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'PIN Salah!' });
      setProfilePinInput("");
    }
  };

  // 💡 Fungsi keluar dari Profile (Kembali ke layar Netflix)
  const handleGantiProfile = () => {
    sessionStorage.removeItem("laundro_active_profile");
    setIsProfileScreen(true);
  };

  async function handleLogout() {
    catatLog("Logout", "Admin/Kasir keluar dari sistem.");
    sessionStorage.removeItem("laundro_secure_unlocked"); 
    localStorage.removeItem("laundro_active_menu");
    sessionStorage.removeItem("laundro_store_id");

    await supabase.auth.signOut(); 
    router.push("/login");
  }

  function bukaModalFoto(id: number, nama: string) {
    setSelectedOrder({ id, customer_name: nama });
    setDeliveryPhoto(null); setLivePreviewUrl(null); setIsPhotoModalOpen(true);
  }

  function handlePilihFotoPengiriman(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setDeliveryPhoto(file); setLivePreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function lihatFotoBukti(idPesanan: number) {
    if (buktiFotoUrls[idPesanan]) { 
      setPreviewTargetUrl(buktiFotoUrls[idPesanan]); 
      setIsPreviewOpen(true); 
    } else { 
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: '📱 Foto bukti pengiriman lama tidak disimpan di server untuk menghemat memori. Silakan cek langsung di Telegram.'
      });
    }
  }

  async function kirimBuktiSelesai(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !deliveryPhoto) return;
    setIsUploadingPhoto(true);

    try {
      const { error } = await supabase.from("orders").update({ status_logistik: "selesai" }).eq("id", selectedOrder.id);
      if (error) throw new Error(error.message);
      
      setPesanan(prev => prev.map(p => p.id === selectedOrder.id ? { ...p, status_logistik: "selesai" } : p)); 
      const waktuSelesai = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
      const pesanCaption = `✅ *PESANAN SELESAI*\n\nHalo kak ${selectedOrder.customer_name}!\n🕒 *Waktu Selesai:* ${waktuSelesai}\n📦 Terima kasih!`;
      
      const fileData = new FormData();
      fileData.append("chat_id", chatId); fileData.append("photo", deliveryPhoto); fileData.append("caption", pesanCaption); fileData.append("parse_mode", "Markdown");

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, { method: "POST", body: fileData });
      if (livePreviewUrl) setBuktiFotoUrls(prev => ({ ...prev, [selectedOrder.id]: livePreviewUrl }));
      
      catatLog("Pesanan Selesai", `Pesanan #${selectedOrder.id} selesai. Bukti foto diunggah.`);
      
      Swal.fire({
        icon: 'success',
        title: 'Sukses 🎉',
        text: 'Pengiriman Berhasil!',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) { 
      Swal.fire('Gagal', 'Gagal memproses penyelesaian.', 'error');
    } 
    finally { setIsUploadingPhoto(false); setIsPhotoModalOpen(false); setSelectedOrder(null); setDeliveryPhoto(null); setLivePreviewUrl(null); }
  }

  async function handleSimpanPengeluaran(e: React.FormEvent) {
    e.preventDefault();
    if (!formPengeluaran.nominal) return;
    
    if (!fotoStruk) {
      Swal.fire('Peringatan ⚠️', 'Harap unggah foto struk/bon pengeluaran terlebih dahulu!', 'warning');
      return;
    }

    const storeId = sessionStorage.getItem("laundro_store_id");
    if (!storeId) return;

    try {
      const { error } = await supabase.from("expenses").insert([{
        store_id: storeId, 
        kategori: formPengeluaran.kategori,
        deskripsi: formPengeluaran.deskripsi,
        nominal: Number(formPengeluaran.nominal),
        created_at: new Date().toISOString()
      }]);
      
      if (error) throw new Error(error.message);

      let infoRestockTelegram = "";
      const matchAngka = formPengeluaran.deskripsi.match(/\d+/);
      const qtyDitemukan = matchAngka ? parseInt(matchAngka[0], 10) : 0;

      if (qtyDitemukan > 0 && formPengeluaran.kategori.includes("Restock")) {
        let updatedInv = { ...inventory };
        if (formPengeluaran.kategori === "Restock Deterjen") {
          updatedInv.deterjen += qtyDitemukan;
          infoRestockTelegram = `\n📦 *Stok Gudang Bertambah:* +${qtyDitemukan} ml Deterjen`;
        } else if (formPengeluaran.kategori === "Restock Parfum") {
          updatedInv.parfum += qtyDitemukan;
          infoRestockTelegram = `\n📦 *Stok Gudang Bertambah:* +${qtyDitemukan} ml Parfum`;
        } else if (formPengeluaran.kategori === "Restock Plastik") {
          updatedInv.plastik += qtyDitemukan;
          infoRestockTelegram = `\n📦 *Stok Gudang Bertambah:* +${qtyDitemukan} Pcs Plastik`;
        }
        
        await supabase.from("inventory").update(updatedInv).eq("store_id", storeId); 
      }
      
      const pesanCaption = `💸 *PENGELUARAN BARU*\n\n📌 *Kategori:* ${formPengeluaran.kategori}\n📝 *Ket:* ${formPengeluaran.deskripsi}\n💰 *Nominal:* Rp ${Number(formPengeluaran.nominal).toLocaleString('id-ID')}${infoRestockTelegram}`;
      
      const fileData = new FormData();
      fileData.append("chat_id", chatId); 
      fileData.append("photo", fotoStruk); 
      fileData.append("caption", pesanCaption); 
      fileData.append("parse_mode", "Markdown");

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, { method: "POST", body: fileData });

      await catatLog(
        "PENGELUARAN_BARU", 
        `Mencatat pengeluaran [${formPengeluaran.kategori}] sebesar Rp ${Number(formPengeluaran.nominal).toLocaleString('id-ID')}`
      );
      Swal.fire({
        icon: 'success',
        title: 'Berhasil ✅',
        text: 'Pengeluaran operasional & struk berhasil dicatat!',
        timer: 2000,
        showConfirmButton: false
      });
      
      setFormPengeluaran({ kategori: "Listrik (Token/Pasca)", deskripsi: "", nominal: "" });
      setFotoStruk(null);
      setPreviewStrukUrl(null);
      ambilData(); 
    } catch (err: any) { 
      Swal.fire('Gagal', "Gagal menyimpan pengeluaran: " + err.message, 'error');
    }
  }

  async function handleTambahPesanan(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.total_harga <= 0) {
      Swal.fire('Peringatan ⚠️', 'Total tagihan tidak boleh Rp 0! Harap masukkan berat (KG) atau jumlah pakaian terlebih dahulu.', 'warning'); 
      return;
    }

    if (formData.status_pembayaran !== "Belum Bayar" && !paymentPhoto) {
      Swal.fire('Peringatan ⚠️', 'Harap unggah foto bukti transaksi pembayaran (Transfer/QRIS/Cash) terlebih dahulu!', 'warning'); 
      return;
    }
    setIsSubmitting(true);
    
    const storeId = sessionStorage.getItem("laundro_store_id");
    if (!storeId) {
       Swal.fire('Error', 'Sistem gagal mendeteksi ID Toko. Silakan refresh halaman.', 'error');
       setIsSubmitting(false);
       return;
    }

    try {
      const { data: newOrderData, error } = await supabase.from("orders").insert([
        { 
          store_id: storeId, 
          customer_name: formData.customer_name, 
          alamat_detail: formData.alamat_detail, 
          jarak_ke_toko_km: Number(formData.jarak_ke_toko_km), 
          berat_pesanan_kg: Number(formData.berat_pesanan_kg), 
          latitude: formData.latitude ? Number(formData.latitude) : null, 
          longitude: formData.longitude ? Number(formData.longitude) : null, 
          tipe_layanan: formData.tipe_layanan,
          paket_layanan: formData.paket_layanan,
          metode_pengiriman: formData.metode_pengiriman,
          status_pembayaran: formData.status_pembayaran,
          jumlah_dp: formData.status_pembayaran === "DP" ? Number(formData.jumlah_dp) : 0,
          harga_per_unit: Number(formData.harga_per_unit),
          total_harga: formData.total_harga,
          rincian_item: rincianItem,
          status_logistik: "Antrean",
          created_at: new Date().toISOString()
        }
      ]).select("*");
      
      if (error) throw new Error(error.message);

      const berat = Number(formData.berat_pesanan_kg) || 1;
      const nDet = Math.max(0, inventory.deterjen - Math.round(berat * 50));
      const nPar = Math.max(0, inventory.parfum - Math.round(berat * 20));
      const nPlas = Math.max(0, inventory.plastik - 1);
      
      await supabase.from("inventory").update({ deterjen: nDet, parfum: nPar, plastik: nPlas }).eq("store_id", storeId); 

      if (nDet < 1000 || nPar < 500 || nPlas < 10) {
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: `⚠️ *DARURAT INVENTARIS TOKO* Stok menipis. Segera restock!`, parse_mode: "Markdown" })
        }).catch(console.error);
      }

      const orderId = newOrderData && newOrderData[0] ? newOrderData[0].id : "BARU";
      catatLog("Pesanan Baru", `Input Order #${orderId} - ${formData.customer_name} (Rp${formData.total_harga}) - Status: ${formData.status_pembayaran}`);

      let detailPakaianTxt = "";
      const rincianTerisi = Object.entries(rincianItem).filter(([key, value]) => value > 0);
      if (rincianTerisi.length > 0) {
        detailPakaianTxt = "\n\n👕 *Rincian Pakaian:*\n" + rincianTerisi.map(([key, value]) => `▪️ ${key} : ${value} pcs`).join("\n");
      }

      const notaDigital = `🧾 *NOTA ${formData.status_pembayaran !== 'Belum Bayar' ? '& BUKTI PEMBAYARAN ' : 'PESANAN '}(#${orderId})* 🧾\n🏪 *${namaToko.toUpperCase() || 'LAUNDRY'}*\n📍 ${kontakToko || '-'}\n➖➖➖➖➖➖➖➖➖➖\n👤 *Pelanggan:* ${formData.customer_name}\n💳 *Keuangan:* ${formData.status_pembayaran.toUpperCase()}\n📦 *Paket:* ${formData.paket_layanan} (${formData.tipe_layanan.toUpperCase()})${detailPakaianTxt}\n\n💰 *TOTAL TAGIHAN: Rp ${formData.total_harga.toLocaleString('id-ID')}*`;

      if (formData.status_pembayaran !== "Belum Bayar" && paymentPhoto) {
        const telegramFormData = new FormData();
        telegramFormData.append("chat_id", chatId); telegramFormData.append("photo", paymentPhoto); 
        telegramFormData.append("caption", notaDigital); telegramFormData.append("parse_mode", "Markdown");
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, { method: "POST", body: telegramFormData });
      } else {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: notaDigital, parse_mode: "Markdown" })
        });
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Pesanan Berhasil!',
        text: 'Nota telah dikirim ke Telegram.',
        timer: 2500,
        showConfirmButton: false
      });

      setIsModalOpen(false); 
      setFormData({ customer_name: "", alamat_detail: "", jarak_ke_toko_km: "", berat_pesanan_kg: "", latitude: "", longitude: "", tipe_layanan: "kiloan", paket_layanan: "Cuci Kering Setrika Lipat", metode_pengiriman: "Diantar Driver Internal", status_pembayaran: "Lunas", jumlah_dp: "0", harga_per_unit: "7000", total_harga: 0 }); 
      setRincianItem({ "👕": 0, "👖": 0, "👔": 0, "🧥": 0, "🩲": 0, "🧦": 0, "🧣": 0 }); 
      setPaymentPhoto(null); setPaymentPreviewUrl(null); 
      ambilData(); 

    } catch (err: any) { 
      Swal.fire('Gagal', "Terjadi kesalahan: " + err.message, 'error'); 
    } 
    finally { setIsSubmitting(false); }
  }

  async function handleTambahCustomer(e: React.FormEvent) {
    e.preventDefault(); setIsSubmittingCustomer(true);
    const storeId = sessionStorage.getItem("laundro_store_id");
    const { error } = await supabase.from("customers").insert([{ store_id: storeId, name: customerFormData.name, alamat_detail: customerFormData.alamat_detail, jarak_ke_toko_km: Number(customerFormData.jarak_ke_toko_km) }]);
    setIsSubmittingCustomer(false);
    
    if (error) {
      Swal.fire('Gagal', "Error: " + error.message, 'error');
    } else { 
      catatLog("Pelanggan Baru", `Mendaftarkan pelanggan baru: ${customerFormData.name}`);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Pelanggan baru berhasil ditambahkan.',
        timer: 1500,
        showConfirmButton: false
      });
      setIsCustomerModalOpen(false); setCustomerFormData({ name: "", alamat_detail: "", jarak_ke_toko_km: "" }); ambilData(); 
    }
  }

  async function generateDanKirimLaporan() {
    setIsExporting(true);
    try {
      let barisCsv = "ID Pesanan,Tanggal,Nama Pelanggan,Paket,Pengiriman,Berat/Qty,Total Harga,Status Keuangan,Status Logistik\n";
      dataTersaring.forEach((item) => {
        const d = new Date(item.created_at || item.createdAt || Date.now());
        const tgl = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        barisCsv += `${item.id || "-"},${tgl},${String(item.customer_name || "-").replace(/,/g, " ")},${item.paket_layanan || "-"},${item.metode_pengiriman || "-"},${item.berat_pesanan_kg || "0"},${item.total_harga || "0"},${item.status_pembayaran || "Lunas"},${item.status_logistik || "-"}\n`;
      });
      const blob = new Blob([barisCsv], { type: "text/csv;charset=utf-8;" });
      const fileLaporan = new FormData();
      fileLaporan.append("chat_id", chatId); fileLaporan.append("document", blob, `Laporan_${filterTanggal || "Semua"}.csv`);
      fileLaporan.append("caption", `📊 REKAP LAPORAN LOGISTIK & FINANSIAL\n\nTotal Data: ${dataTersaring.length} pesanan.`);
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendDocument`, { method: "POST", body: fileLaporan });
      catatLog("Export Data", "Admin mengunduh laporan excel pesanan.");
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil! 🚀',
        text: 'Laporan Excel berhasil dikirim ke Telegram!'
      });
    } catch (err) { 
      Swal.fire('Gagal', 'Kesalahan sistem saat membuat laporan.', 'error'); 
    } finally { setIsExporting(false); }
  }

  // ==========================================
  // LOGIKA KALENDER & PENGELUARAN (TIDAK ADA PERUBAHAN)
  // ==========================================
  const pesananBulanIni = pesanan.filter(p => {
    const tglRaw = p.created_at || p.createdAt;
    if (!tglRaw) return false;
    const d = new Date(tglRaw);
    return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
  });

  const pengeluaranBulanIni = pengeluaran.filter(p => {
    if(!p.created_at) return false;
    const d = new Date(p.created_at);
    return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
  });

  const rekapHarian: { [key: number]: { qty: number, total: number } } = {};
  pesananBulanIni.forEach(p => {
     const tglRaw = p.created_at || p.createdAt;
     const d = new Date(tglRaw);
     const tgl = d.getDate();
     if(!rekapHarian[tgl]) rekapHarian[tgl] = { qty: 0, total: 0 };
     rekapHarian[tgl].qty += 1;
     rekapHarian[tgl].total += Number(p.total_harga || 0);
  });

  const pengeluaranHarian: { [key: number]: number } = {};
  pengeluaranBulanIni.forEach(p => {
     const d = new Date(p.created_at);
     const tgl = d.getDate();
     if(!pengeluaranHarian[tgl]) pengeluaranHarian[tgl] = 0;
     pengeluaranHarian[tgl] += Number(p.nominal || 0);
  });

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCards = [];
  for(let i = 1; i <= daysInMonth; i++) {
     const income = rekapHarian[i]?.total || 0;
     const expense = pengeluaranHarian[i] || 0;
     const labaRugiHarian = income - expense; 

     calendarCards.push({ 
       tanggal: i, 
       qty: rekapHarian[i]?.qty || 0, 
       total: income, 
       pengeluaran: expense,
       labaRugi: labaRugiHarian 
     });
  }

  const totalBulanQty = calendarCards.reduce((acc, curr) => acc + curr.qty, 0);
  const totalBulanRp = pesananBulanIni.reduce((acc, curr) => acc + Number(curr.total_harga || 0), 0);
  const totalPengeluaranBulanRp = pengeluaranBulanIni.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);
  const labaBersih = totalBulanRp - totalPengeluaranBulanRp;
  
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div></div>;
  if (!session) return null;

  // 🍿 TAMPILAN PEMILIHAN PROFIL ALA NETFLIX
  if (isProfileScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-gray-900 to-black">
        
        {/* LOGO TOKO */}
        <div className="absolute top-8 text-center animate-fade-in-down">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            {namaToko || "LaundroAI"}
          </h1>
        </div>

        <h2 className="text-2xl md:text-4xl font-semibold text-white mb-10 tracking-wide text-center">
          Siapa yang sedang bertugas?
        </h2>

        <div className="flex gap-6 md:gap-12 justify-center flex-wrap">
          {/* AVATAR OWNER */}
          <div onClick={() => handleSelectProfile("owner")} className="group cursor-pointer flex flex-col items-center gap-4 transition-transform hover:scale-110 active:scale-95">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center border-4 border-transparent group-hover:border-white transition-all shadow-2xl overflow-hidden relative">
              <span className="text-6xl md:text-7xl">👑</span>
              <div className="absolute bottom-0 w-full bg-black/40 text-center py-1 text-xs font-bold text-white/80 backdrop-blur-sm">PIN Protected</div>
            </div>
            <span className="text-gray-400 group-hover:text-white font-bold text-lg md:text-xl transition-colors">Owner</span>
          </div>

          {/* AVATAR KASIR */}
          <div onClick={() => handleSelectProfile("kasir")} className="group cursor-pointer flex flex-col items-center gap-4 transition-transform hover:scale-110 active:scale-95">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center border-4 border-transparent group-hover:border-white transition-all shadow-2xl overflow-hidden relative">
              <span className="text-6xl md:text-7xl">🧑‍💻</span>
              <div className="absolute bottom-0 w-full bg-black/40 text-center py-1 text-xs font-bold text-white/80 backdrop-blur-sm">PIN Protected</div>
            </div>
            <span className="text-gray-400 group-hover:text-white font-bold text-lg md:text-xl transition-colors">Kasir Toko</span>
          </div>
        </div>

        <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} className="absolute bottom-8 px-6 py-2 rounded-full border border-white/20 text-white/50 hover:text-white hover:bg-white/10 font-bold text-sm transition-all">
          Logout dari Toko
        </button>

        {/* MODAL INPUT PIN PROFIL */}
        {profilePinModal.isOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
            <form onSubmit={handleVerifyProfilePin} className="bg-gray-900 border border-white/20 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl">
              <div className="text-5xl mb-4">{profilePinModal.role === "owner" ? "👑" : "🧑‍💻"}</div>
              <h2 className="text-2xl font-black text-white mb-2">PIN {profilePinModal.role.toUpperCase()}</h2>
              <p className="text-sm text-gray-400 mb-6">Masukkan 6 digit PIN rahasia Anda.</p>
              <input type="password" required maxLength={6} value={profilePinInput} onChange={e => setProfilePinInput(e.target.value.replace(/\D/g, ''))} autoFocus className="w-full text-center text-3xl tracking-[1em] font-black bg-black/50 border border-white/20 text-white rounded-xl py-4 mb-6 outline-none focus:border-blue-500 transition-colors" placeholder="••••••" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setProfilePinModal({ isOpen: false, role: "" })} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">Masuk</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  const pengeluaranTersaring = pengeluaran.filter(p => {
    if (!filterTanggalPengeluaran) {
      if(!p.created_at) return false;
      const d = new Date(p.created_at);
      return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
    }
    const tglRaw = p.created_at;
    if (!tglRaw) return false; 
    const d = new Date(tglRaw);
    const itemLocalYYYYMMDD = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return itemLocalYYYYMMDD === filterTanggalPengeluaran;
  });

  const stokTersaring = pengeluaran.filter(p => {
    if (!p.kategori.includes("Restock")) return false; 

    if (!filterTanggalInventory) return true; 
    
    const tglRaw = p.created_at;
    if (!tglRaw) return false; 
    const d = new Date(tglRaw);
    const itemLocalYYYYMMDD = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return itemLocalYYYYMMDD === filterTanggalInventory;
  });

  const dataTersaring = [...pesanan]
    .filter((item) => filterStatus === "semua" ? true : item.status_logistik === filterStatus)
    .filter((item) => {
      if (!filterTanggal) return true; 
      const tglRaw = item.created_at || item.createdAt;
      if (!tglRaw) return false; 
      const d = new Date(tglRaw);
      const itemLocalYYYYMMDD = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return itemLocalYYYYMMDD === filterTanggal;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      return sortBy === "terbaru" ? timeB - timeA : timeA - timeB; 
    });

  const dynamicBg = isDarkMode ? "bg-gradient-to-br from-indigo-950 via-gray-900 to-purple-950 text-white" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 text-gray-900";
  const glassPanel = isDarkMode ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" : "bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]";
  const glassInput = isDarkMode ? "bg-black/20 border border-white/10 text-white placeholder-gray-400 focus:bg-black/40 focus:border-indigo-400" : "bg-white/50 border border-white/60 text-gray-900 placeholder-gray-500 focus:bg-white/80 focus:border-indigo-400";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-600";
  const rowHover = isDarkMode ? "hover:bg-white/5" : "hover:bg-white/50";
  const tableHeaderGlass = isDarkMode ? "bg-black/20 border-b border-white/10" : "bg-white/30 border-b border-white/40";

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 relative ${dynamicBg}`}>
      <button onClick={() => setIsSidebarOpen(true)} className={`md:hidden fixed top-4 left-4 z-40 p-3 rounded-xl ${glassPanel} active:scale-95`}><span className="text-xl">☰</span></button>
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />}

      {/* MODAL PIN KEAMANAN MENU */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleVerifyPin} className="bg-gray-900 border border-white/20 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2">🔐 Otorisasi PIN</h2>
            <p className="text-sm text-gray-400 mb-6">Masukkan 6 digit PIN untuk membuka menu <strong>{pendingMenu}</strong></p>
            <input type="password" required maxLength={6} value={inputPin} onChange={e => setInputPin(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-3xl tracking-[1em] font-black bg-black/50 border border-white/20 text-white rounded-xl py-4 mb-6 outline-none focus:border-blue-500" placeholder="••••••" />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setIsPinModalOpen(false); setInputPin(""); }} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20">Batal</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg">Buka Kunci</button>
            </div>
          </form>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 flex flex-col justify-between ${glassPanel} border-r border-r-white/10 md:m-4 md:rounded-3xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-white opacity-70 text-2xl font-bold">✕</button>
        <div>
          <div className="p-6 flex items-center gap-3 mt-4 md:mt-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">L</div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">LaundroAI</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isOwnerMode ? 'text-emerald-400' : 'text-blue-400'}`}>
                {isOwnerMode ? '👑 Mode Owner' : '🧑‍💻 Mode Kasir'}
              </p>
            </div>
          </div>
          
            <button
              onClick={bukaPengaturan}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <span className="text-xl">⚙️</span>
              <span className="font-semibold tracking-wide">Pengaturan Toko</span>
            </button>
          <nav className="mt-4 px-4 space-y-2">
            {(isOwnerMode 
              ? ['Dashboard', 'Database Customers', 'Tracking', 'Inventory', 'Calendar', 'Pengeluaran', 'Data Log']
              : ['Dashboard', 'Database Customers', 'Pengeluaran']
            ).map((menu) => {
              const isLocked = !isSecureUnlocked && ["Calendar", "Pengeluaran", "Data Log"].includes(menu);
              return (
                <button 
                  key={menu} 
                  onClick={() => handleMenuClick(menu)} 
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${activeMenu === menu ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-white/20" : `${isDarkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-white/40'}`}`}
                >
                  <div className="flex items-center gap-3">
                    {menu === 'Dashboard' && "📊"} 
                    {menu === 'Tracking' && "📍"} 
                    {menu === 'Database Customers' && "👥"} 
                    {menu === 'Calendar' && "📅"} 
                    {menu === 'Inventory' && "📦"} 
                    {menu === 'Pengeluaran' && "💸"} 
                    {menu === 'Data Log' && "🛡️"}
                    <span className="text-sm truncate max-w-[120px]">
                      {menu === 'Calendar' ? 'Pemasukan' : menu === 'Inventory' ? 'Stok Gudang' : menu}
                    </span>
                  </div>
                  {isLocked && <span className="text-xs opacity-50">🔒</span>}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 space-y-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all active:scale-95 text-sm font-bold ${glassPanel}`}><span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span> <span>{isDarkMode ? '🌙' : '☀️'}</span></button>
          <button onClick={handleLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 backdrop-blur-md">Keluar Sistem 🔒</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 pt-5 md:pt-10 scroll-smooth z-10 w-full max-w-full relative">
        {/* DOUBLE LOCK GUARDRAIL */}
        {!isOwnerMode && ["Tracking", "Inventory", "Calendar", "Data Log"].includes(activeMenu) && (
          <div className="text-center p-10">
            <h2 className="text-xl font-black text-red-400 mb-2">🛑 AKSES DITOLAK</h2>
            <p className="text-sm opacity-60 mb-4">Halaman ini hanya dapat diakses oleh Owner Toko.</p>
            <button onClick={() => setActiveMenu("Dashboard")} className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white">Kembali ke Dashboard</button>
          </div>
        )}

        {/* MODUL PENGELUARAN */}
        {activeMenu === "Pengeluaran" ? (
          <div className="max-w-7xl mx-auto flex flex-col h-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6 md:mt-0 pl-14 md:pl-0">Catat Pengeluaran 💸</h1>
            <div className={`grid ${isOwnerMode ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"} gap-6`}>
              
              <div className={`p-6 rounded-3xl ${glassPanel} border-t-4 border-red-500 h-fit ${!isOwnerMode ? "max-w-md mx-auto w-full" : "md:col-span-1"}`}>
                <h3 className="font-bold text-lg mb-4 border-b border-white/10 pb-2">Form Kas Keluar</h3>
                <form onSubmit={handleSimpanPengeluaran} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold opacity-70 block mb-1">Kategori Pengeluaran</label>
                    <select value={formPengeluaran.kategori} onChange={e => setFormPengeluaran({...formPengeluaran, kategori: e.target.value})} className={`w-full p-3 rounded-xl ${glassInput} outline-none cursor-pointer`}>
                      <option className="text-black">Listrik (Token/Pasca)</option>
                      <option className="text-black">Bensin Operasional</option>
                      <option className="text-black">Restock Deterjen</option>
                      <option className="text-black">Restock Parfum</option>
                      <option className="text-black">Restock Plastik</option>
                      <option className="text-black">Lain-Lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-70 block mb-1">Total Nominal (Rp)</label>
                    <input type="number" required value={formPengeluaran.nominal} onChange={e => setFormPengeluaran({...formPengeluaran, nominal: e.target.value})} className={`w-full p-3 rounded-xl ${glassInput}`} placeholder="50000" />
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-70 block mb-1">Deskripsi / Keterangan</label>
                    <textarea 
                      required 
                      value={formPengeluaran.deskripsi} 
                      onChange={e => setFormPengeluaran({...formPengeluaran, deskripsi: e.target.value})} 
                      className={`w-full p-3 rounded-xl ${glassInput}`} 
                      rows={2} 
                      placeholder={formPengeluaran.kategori.includes("Restock") ? "Cth: Beli 5000 ml deterjen" : "Isi pertalite driver Budi..."}>
                    </textarea>
                    {formPengeluaran.kategori.includes("Restock") && (
                      <p className="text-[10px] text-emerald-400 mt-1">💡 Tuliskan angka (TOTAL ml/pcs) di deskripsi untuk otomatis tambah stok gudang!</p>
                    )}
                  </div>
                  <div className="border border-white/20 bg-black/10 rounded-xl p-3">
                    <label className="block text-xs font-bold mb-2 opacity-80">📸 Upload Struk / Bon (Wajib)</label>
                    {previewStrukUrl ? (
                      <div className="w-full h-32 bg-black/20 rounded-xl overflow-hidden border border-white/20 relative">
                        <img src={previewStrukUrl} alt="Preview Struk" className="w-full h-full object-cover" />
                        <input type="file" accept="image/*" capture="environment" onChange={handlePilihFotoStruk} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    ) : (
                      <div className="w-full h-16 bg-white/5 rounded-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-white/70 hover:bg-white/10 relative cursor-pointer">
                        <span className="font-bold text-xs">📷 Tap untuk Ambil Foto Bon</span>
                        <input type="file" accept="image/*" capture="environment" required onChange={handlePilihFotoStruk} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg border border-white/20">Tambah Pengeluaran</button>
                </form>
              </div>

              {/* KOLOM KANAN: RIWAYAT */}
              {isOwnerMode && (
                <div className={`md:col-span-2 p-6 rounded-3xl ${glassPanel} flex flex-col`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/10 pb-3 gap-3">
                    <h3 className="font-bold text-lg">Riwayat Pengeluaran</h3>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 shadow-inner`}>
                      <span className="text-xs font-bold opacity-60">📅 Filter:</span>
                      <input type="date" value={filterTanggalPengeluaran} onChange={(e) => setFilterTanggalPengeluaran(e.target.value)} className="text-xs font-bold outline-none bg-transparent cursor-pointer" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                      {filterTanggalPengeluaran && <button onClick={() => setFilterTanggalPengeluaran("")} className="text-red-400 hover:text-red-500 ml-1 text-xs font-bold transition-colors">✕</button>}
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-sm">
                      <thead className={tableHeaderGlass}>
                        <tr><th className="p-3">Tanggal & Waktu</th><th className="p-3">Kategori</th><th className="p-3">Deskripsi</th><th className="p-3 text-right">Nominal</th></tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-black/5'}`}>
                        {pengeluaranTersaring.map(ex => (
                          <tr key={ex.id} className={rowHover}>
                            <td className="p-3 opacity-70 text-[11px] whitespace-nowrap">
                              {new Date(ex.created_at).toLocaleString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })} WIB
                            </td>
                            <td className="p-3 font-bold text-red-400">{ex.kategori}</td>
                            <td className="p-3 text-xs">{ex.deskripsi}</td>
                            <td className="p-3 font-black text-right text-red-400 whitespace-nowrap">Rp {Number(ex.nominal).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                        {pengeluaranBulanIni.length === 0 && <tr><td colSpan={4} className="text-center p-6 opacity-50">Belum ada data pengeluaran bulan ini.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeMenu === "Data Log" ? (
          <div className="max-w-5xl mx-auto flex flex-col pb-10">
            <div className="mb-6 flex justify-between items-end border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                  Riwayat Aktivitas 🕵️‍♂️
                </h1>
                <p className="text-sm mt-1 text-gray-400">Pantau semua pergerakan data, transaksi, dan operasional kasir.</p>
              </div>
              <button onClick={ambilAuditLogs} className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95">
                🔄 Refresh
              </button>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
              {auditLogs.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="font-bold">Belum ada aktivitas tercatat.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => {
                    // Penentuan warna label berdasarkan jenis aksi
                    let warnaBadge = "bg-gray-500/20 text-gray-300 border-gray-500/30";
                    if (log.aksi.includes("TAMBAH") || log.aksi.includes("BUAT")) warnaBadge = "bg-blue-500/20 text-blue-300 border-blue-500/30";
                    if (log.aksi.includes("LUNAS") || log.aksi.includes("BAYAR")) warnaBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                    if (log.aksi.includes("HAPUS") || log.aksi.includes("BATAL")) warnaBadge = "bg-red-500/20 text-red-300 border-red-500/30";
                    if (log.aksi.includes("UBAH") || log.aksi.includes("UPDATE")) warnaBadge = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";

                    const waktu = new Date(log.created_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });

                    return (
                      <div key={log.id} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                        {/* Garis & Titik Waktu */}
                        <div className="flex flex-col items-center pt-1 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                          <div className="w-[1px] h-full bg-white/10 mt-2"></div>
                        </div>
                        
                        {/* Konten Log */}
                        <div className="flex-1 pb-2">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono opacity-60 bg-black px-2 py-0.5 rounded-md border border-white/10">{waktu}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${warnaBadge}`}>
                              {log.aksi}
                            </span>
                            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                              👤 {log.nama_kasir}
                            </span>
                          </div>
                          <p className="text-sm text-gray-200">{log.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeMenu === "Inventory" ? (
          <div className="max-w-7xl mx-auto flex flex-col h-full">
            <div className="mb-6 md:mt-0 pl-14 md:pl-0"><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Stok Gudang 📦</h1></div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              <div onClick={() => setIsInventoryModalOpen(true)} className={`cursor-pointer hover:bg-white/5 active:scale-95 transition-all p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 border-blue-500`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Deterjen</p>
                <p className="text-[13px] sm:text-2xl font-mono font-black mt-1 text-blue-400 truncate">{inventory.deterjen}</p>
              </div>
              <div onClick={() => setIsInventoryModalOpen(true)} className={`cursor-pointer hover:bg-white/5 active:scale-95 transition-all p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 border-purple-500`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Parfum</p>
                <p className="text-[13px] sm:text-2xl font-mono font-black mt-1 text-purple-400 truncate">{inventory.parfum}</p>
              </div>
              <div onClick={() => setIsInventoryModalOpen(true)} className={`cursor-pointer hover:bg-white/5 active:scale-95 transition-all p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 border-emerald-500`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Plastik</p>
                <p className="text-[13px] sm:text-2xl font-mono font-black mt-1 text-emerald-400 truncate">{inventory.plastik}</p>
              </div>
            </div>

      {isInventoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4" onClick={() => setIsInventoryModalOpen(false)}>
          <div className={`rounded-3xl w-full max-w-sm p-6 ${glassPanel} border-white/20 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
              <h2 className="font-bold text-lg text-indigo-300">📦 Rincian Stok Gudang</h2>
              <button onClick={() => setIsInventoryModalOpen(false)} className="opacity-70 hover:opacity-100 text-xl">×</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-l-4 border-l-blue-500">
                <p className="text-xs opacity-70 font-bold uppercase mb-1">🧼 Deterjen</p>
                <p className="text-2xl font-mono font-black text-blue-400 break-words">{inventory.deterjen} ml</p>
              </div>
              
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-l-4 border-l-purple-500">
                <p className="text-xs opacity-70 font-bold uppercase mb-1">🌸 Parfum</p>
                <p className="text-2xl font-mono font-black text-purple-400 break-words">{inventory.parfum} ml</p>
              </div>

              <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-l-4 border-l-emerald-500">
                <p className="text-xs opacity-70 font-bold uppercase mb-1">🛍️ Plastik Packing</p>
                <p className="text-2xl font-mono font-black text-emerald-400 break-words">{inventory.plastik} Pcs</p>
              </div>
            </div>
            
            <button onClick={() => setIsInventoryModalOpen(false)} className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-all">Tutup Rincian</button>
          </div>
        </div>
      )}

            <div className={`flex-1 flex flex-col p-6 rounded-3xl ${glassPanel} overflow-hidden`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/10 pb-3 gap-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  ⏳ Riwayat Stok Masuk
                </h3>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 shadow-inner`}>
                  <span className="text-xs font-bold opacity-60">📅 Filter:</span>
                  <input type="date" value={filterTanggalInventory} onChange={(e) => setFilterTanggalInventory(e.target.value)} className="text-xs font-bold outline-none bg-transparent cursor-pointer" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                  {filterTanggalInventory && <button onClick={() => setFilterTanggalInventory("")} className="text-red-400 hover:text-red-500 ml-1 text-xs font-bold transition-colors">✕</button>}
                </div>
              </div>

              <div className="overflow-x-auto flex-1 max-h-[400px] pr-2 scroll-smooth">
                <table className="w-full text-left text-sm">
                  <thead className={tableHeaderGlass}>
                    <tr>
                      <th className="p-3 font-semibold text-sm tracking-wide">Tanggal & Waktu</th>
                      <th className="p-3 font-semibold text-sm tracking-wide">Kategori Barang</th>
                      <th className="p-3 font-semibold text-sm tracking-wide">Deskripsi Penambahan</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-black/5'}`}>
                    {stokTersaring.map((stok) => (
                        <tr key={stok.id} className={`transition-colors ${rowHover}`}>
                          <td className="p-3 opacity-70 text-[11px] whitespace-nowrap">
                            {new Date(stok.created_at).toLocaleString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })} WIB
                          </td>
                          <td className="p-3 font-bold text-indigo-400">{stok.kategori}</td>
                          <td className="p-3 text-xs">{stok.deskripsi}</td>
                        </tr>
                      ))}
                    {stokTersaring.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center p-8 opacity-50">
                          <div className="text-4xl mb-2">📦</div>
                          Belum ada riwayat stok masuk di tanggal tersebut.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeMenu === "Calendar" ? (
          <div className="max-w-7xl mx-auto flex flex-col">
            
            {/* 1. HEADER KALENDER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0 md:mt-0">
              <div className="pl-14 md:pl-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 sm:gap-3">
                  Laporan Laba & Rugi 📅
                  <button onClick={() => setIsNominalHidden(!isNominalHidden)} className="text-2xl hover:scale-110 transition-transform active:scale-90" title={isNominalHidden ? "Tampilkan Nominal" : "Sembunyikan Nominal"}>
                    {isNominalHidden ? "🙈" : "👁️"}
                  </button>
                </h1>
                <p className={`text-sm mt-1 ${textMuted}`}>Pantau rekap transaksi dan keuntungan toko bersih harian.</p>
              </div>
              <div className="flex gap-2">
                <select value={calendarMonth} onChange={e => setCalendarMonth(Number(e.target.value))} className={`px-4 py-2 rounded-xl font-bold outline-none cursor-pointer ${glassPanel} text-black dark:text-white`}>
                  {namaBulan.map((m, i) => <option key={i} value={i} className="text-black">{m}</option>)}
                </select>
                <input type="number" value={calendarYear} onChange={e => setCalendarYear(Number(e.target.value))} className={`px-4 py-2 rounded-xl font-bold outline-none w-24 ${glassPanel}`} />
              </div>
            </div>

            {/* 2. KARTU RINGKASAN ATAS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 shrink-0">
              <div onClick={() => setIsSummaryModalOpen(true)} className={`cursor-pointer hover:bg-white/5 active:scale-95 transition-all p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 border-emerald-500`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Pemasukan</p>
                <p className="text-[13px] sm:text-2xl font-black mt-1 text-emerald-400 truncate">
                  {isNominalHidden ? "Rp •••••••" : `Rp ${totalBulanRp.toLocaleString("id-ID")}`}
                </p>
              </div>
              <div onClick={() => setIsSummaryModalOpen(true)} className={`cursor-pointer hover:bg-white/5 active:scale-95 transition-all p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 border-red-500`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Pengeluaran</p>
                <p className="text-[13px] sm:text-2xl font-black mt-1 text-red-400 truncate">
                  {isNominalHidden ? "Rp •••••••" : `Rp ${totalPengeluaranBulanRp.toLocaleString("id-ID")}`}
                </p>
              </div>
              <div onClick={() => setIsSummaryModalOpen(true)} className={`cursor-pointer hover:bg-white/5 active:scale-95 transition-all p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 ${labaBersih >= 0 ? 'border-blue-500 bg-blue-900/10' : 'border-yellow-500'}`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Laba(Rugi)Bersih</p>
                <p className={`text-[13px] sm:text-2xl font-black mt-1 truncate ${labaBersih >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {isNominalHidden ? "Rp •••••••" : `Rp ${labaBersih.toLocaleString("id-ID")}`}
                </p>
              </div>
            </div>

            {/* MODAL POPUP RINCIAN TOTAL BULANAN */}
            {isSummaryModalOpen && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4" onClick={() => setIsSummaryModalOpen(false)}>
                <div className={`rounded-3xl w-full max-w-sm p-6 ${glassPanel} border-white/20 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
                    <h2 className="font-bold text-lg text-indigo-300">📊 Rincian Total Bulanan</h2>
                    <button onClick={() => setIsSummaryModalOpen(false)} className="opacity-70 hover:opacity-100 text-xl">×</button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-l-4 border-l-emerald-500">
                      <p className="text-xs opacity-70 font-bold uppercase mb-1">Total Income Kotor</p>
                      <p className="text-2xl font-black text-emerald-400 break-words">
                        {isNominalHidden ? "Rp •••••••" : `Rp ${totalBulanRp.toLocaleString("id-ID")}`}
                      </p>
                    </div>
                    
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-l-4 border-l-red-500">
                      <p className="text-xs opacity-70 font-bold uppercase mb-1">Total Pengeluaran</p>
                      <p className="text-2xl font-black text-red-400 break-words">
                        {isNominalHidden ? "Rp •••••••" : `Rp ${totalPengeluaranBulanRp.toLocaleString("id-ID")}`}
                      </p>
                    </div>

                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-l-4 border-l-blue-500">
                      <p className="text-xs opacity-70 font-bold uppercase mb-1">Laba Bersih Toko</p>
                      <p className={`text-2xl font-black break-words ${labaBersih >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {isNominalHidden ? "Rp •••••••" : `Rp ${labaBersih.toLocaleString("id-ID")}`}
                      </p>
                    </div>
                  </div>
                  
                  <button onClick={() => setIsSummaryModalOpen(false)} className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-all">Tutup Rincian</button>
                </div>
              </div>
            )}

            {/* 3. AREA GRID TANGGAL KALENDER MEMANJANG (TANPA SCROLL DALAM) */}
            <div className="pb-4 w-full mt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                {calendarCards.map(day => (
                  <div key={day.tanggal} onClick={() => handleKlikTanggal(day)} className={`p-4 rounded-2xl border transition-all ${day.qty > 0 || day.pengeluaran > 0 ? 'bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border-indigo-500/30 shadow-lg shadow-indigo-500/10 cursor-pointer hover:border-indigo-400' : `${glassPanel} opacity-60`}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xl font-black opacity-80">{day.tanggal}</span>
                      {(day.qty > 0 || day.pengeluaran > 0) && <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">Aktif</span>}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] opacity-70">Trx: <span className="font-bold text-white text-xs">{day.qty}</span></p>
                      <p className={`text-sm font-black ${day.labaRugi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isNominalHidden 
                          ? "Rp •••" 
                          : `${day.labaRugi < 0 ? '-' : ''}Rp ${Math.abs(day.labaRugi).toLocaleString("id-ID")}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. PANEL GRAFIK ANALISIS BAWAH */}
            <div className={`p-5 rounded-2xl mt-4 mb-10 ${glassPanel} grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-t border-white/10`}>
              
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70">Alokasi Finansial</p>
                {(() => {
                  const safePemasukan = totalBulanRp || 0;
                  const safePengeluaran = totalPengeluaranBulanRp || 0;
                  let pengeluaranPersen = safePemasukan > 0 ? Math.round((safePengeluaran / safePemasukan) * 100) : 0;
                  let labaPersen = 100 - pengeluaranPersen;
                  if (labaBersih < 0) { pengeluaranPersen = 100; labaPersen = 0; }

                  return (
                    <div className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300"
                         style={{
                           background: safePemasukan === 0 && safePengeluaran === 0
                             ? '#4B5563'
                             : `conic-gradient(#10B981 0% ${labaPersen}%, #EF4444 ${labaPersen}% 100%)`
                         }}>
                      <div className={`w-28 h-28 rounded-full ${isDarkMode ? 'bg-slate-900' : 'bg-white'} flex flex-col items-center justify-center p-2 shadow-inner`}>
                        <span className="text-[10px] font-bold opacity-60 uppercase">Margin Laba</span>
                        <span className={`text-xl font-black ${labaBersih >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {safePemasukan > 0 ? `${Math.round((labaBersih / safePemasukan) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="md:col-span-2 space-y-3.5 w-full">
                <h4 className="text-sm font-bold text-indigo-300 hidden md:block">📊 Metrik Efisiensi Operasional</h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 font-semibold text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pemasukan (Gross)</span>
                    <span className="font-mono font-bold">{totalBulanRp > 0 ? '100%' : '0%'}</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2 border border-white/5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: totalBulanRp > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  {(() => {
                    const persenPgl = totalBulanRp > 0 ? Math.round((totalPengeluaranBulanRp / totalBulanRp) * 100) : 0;
                    return (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-2 font-semibold text-red-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Rasio Pengeluaran</span>
                          <span className="font-mono font-bold text-red-400">{persenPgl}%</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-2 border border-white/5 overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, persenPgl)}%` }}></div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  {(() => {
                    const persenLaba = totalBulanRp > 0 ? Math.round((labaBersih / totalBulanRp) * 100) : 0;
                    return (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-2 font-semibold text-blue-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Profitabilitas</span>
                          <span className={`font-mono font-bold ${persenLaba >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>{persenLaba}%</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-2 border border-white/5 overflow-hidden">
                          <div className={`${labaBersih >= 0 ? 'bg-blue-500' : 'bg-yellow-500'} h-full rounded-full transition-all duration-500`} style={{ width: `${labaBersih >= 0 ? Math.max(0, persenLaba) : 0}%` }}></div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="text-[10px] bg-black/20 p-2 rounded-lg border border-white/5 text-center md:text-left mt-2">
                  {totalBulanRp === 0 ? <span className="text-gray-400">💤 Belum ada aktivitas tercatat bulan ini.</span>
                  : labaBersih < 0 ? <span className="text-red-400 font-bold">⚠️ STATUS DEFISIT: Pengeluaran melewati omset!</span>
                  : (totalPengeluaranBulanRp / totalBulanRp) * 100 > 50 ? <span className="text-yellow-400 font-semibold">⚠️ PERINGATAN: Pengeluaran melebihi 50% omset.</span>
                  : <span className="text-emerald-400 font-semibold">🎉 SEHAT: Profit bersih di zona aman. Pertahankan!</span>}
                </div>
              </div>
            </div>
          </div>
        ) : activeMenu === "Tracking" ? (
          <div className="max-w-7xl mx-auto h-full flex flex-col">
             <div className="mb-6 md:mt-0 pl-14 md:pl-0"><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tracking Armada 📍</h1><p className={`text-sm mt-1 ${textMuted}`}>Pantau pergerakan armada pengiriman secara real-time.</p></div>
             <div className={`flex-1 rounded-3xl overflow-hidden p-2 ${glassPanel}`}>
                {!isMapLoaded ? (
                  <div className="w-full h-full min-h-[500px] flex items-center justify-center rounded-2xl"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>
                ) : (
                  <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-inner">
                    <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultMapCenter} zoom={12}>
                      {dataTersaring.map((item) => {
                        if (!item.latitude || !item.longitude) return null;
                        return <Marker key={item.id} position={{ lat: item.latitude, lng: item.longitude }} onClick={() => setSelectedMarker(item)} icon={item.status_logistik === 'selesai' ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png" : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"} />
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
        ) : activeMenu === "Database Customers" ? (
          <div className="max-w-7xl mx-auto overflow-x-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 md:mt-0">
              <div className="pl-14 md:pl-0"><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Database 👥</h1><p className={`text-sm mt-1 ${textMuted}`}>Kelola profil pelanggan untuk fitur Autofill otomatis.</p></div>
              <button onClick={() => setIsCustomerModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/30 border border-white/20 transition-all active:scale-95 flex items-center gap-2">➕ <span>Customer Baru</span></button>
            </div>
            {customers.length === 0 ? (
              <div className={`rounded-3xl p-16 text-center ${glassPanel}`}><div className="text-5xl mb-4 opacity-50">📂</div><h3 className="text-xl font-bold mb-2">Database Kosong</h3><p className={textMuted}>Klik tombol di atas untuk menambah profil.</p></div>
            ) : (
              <div className={`rounded-3xl overflow-x-auto ${glassPanel}`}>
                <table className="min-w-full text-left">
                  <thead className={tableHeaderGlass}><tr><th className="p-5 font-semibold text-sm tracking-wide">Nama Pelanggan</th><th className="p-5 font-semibold text-sm tracking-wide">Alamat Default</th><th className="p-5 font-semibold text-sm tracking-wide">Jarak</th></tr></thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-black/5'}`}>
                    {customers.map((c) => (
                      <tr key={c.id} className={`transition-colors ${rowHover}`}><td className="p-5 font-bold whitespace-nowrap">{c.name}</td><td className="p-5 text-sm min-w-[200px]">{c.alamat_detail}</td><td className="p-5 font-bold text-indigo-400 whitespace-nowrap">{c.jarak_ke_toko_km} km</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col h-full">
            
            <div className="flex flex-col mb-4 pb-3 border-b border-white/10 gap-3 shrink-0">
              
              <div className="pl-14 md:pl-0 flex items-center min-h-[40px]">
                <h1 className="text-3xl font-extrabold tracking-tight whitespace-nowrap flex items-center">
                  Dashboard ⚡ 
                </h1>
              </div>

              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <button onClick={unduhExcel} title="Unduh Excel" className="flex items-center justify-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold transition-all text-[11px] sm:text-xs">
                    <span>📊</span><span className="hidden md:inline">Excel</span>
                  </button>

                  <div className={`flex items-center px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-black/20 border border-white/10 shadow-inner`}>
                    <span className="text-[11px] sm:text-xs mr-1">📅</span>
                    <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="text-[10px] sm:text-xs font-bold outline-none bg-transparent cursor-pointer w-[110px] sm:w-auto" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                    {filterTanggal && <button onClick={() => setFilterTanggal("")} className="text-red-400 hover:text-red-500 ml-1 sm:ml-2 text-[10px] sm:text-xs font-bold">✕</button>}
                  </div>
                </div>

                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all text-xs sm:text-sm shadow-lg shadow-indigo-500/30 whitespace-nowrap">
                  <span className="text-sm sm:text-base">➕</span><span>Pesanan Baru</span>
                </button>
              </div>
            </div>

            {dataTersaring.length === 0 ? (
              <div className={`rounded-3xl p-16 text-center ${glassPanel} my-auto`}><div className="text-5xl mb-4 opacity-50">📭</div><h3 className="text-xl font-bold mb-2">Tidak ada aktivitas</h3><p className={textMuted}>Belum ada data pesanan yang sesuai dengan filter.</p></div>
            ) : viewMode === "table" ? (
              <div className={`rounded-3xl overflow-x-auto ${glassPanel}`}>
                <table className="min-w-full text-left">
                  <thead className={tableHeaderGlass}>
                    <tr><th className="p-5 font-semibold text-sm tracking-wide">ID & Pelanggan</th><th className="p-5 font-semibold text-sm tracking-wide">Layanan</th><th className="p-5 font-semibold text-sm tracking-wide">Keuangan</th><th className="p-5 font-semibold text-sm tracking-wide text-center">Status Papan</th><th className="p-5 font-semibold text-sm tracking-wide text-center">Tindakan</th></tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-black/5'}`}>
                    {dataTersaring.map((item) => {
                      const tglValue = item.created_at || item.createdAt;
                      return (
                        <tr key={item.id} onClick={() => setDetailPesanan(item)} className={`transition-colors cursor-pointer ${rowHover}`}>
                          <td className="p-5 min-w-[150px]">
                            <div className="text-xs font-bold mb-1 opacity-60">#{item.id}</div><div className="font-bold">{item.customer_name}</div>
                            <div className={`text-xs mt-1 font-medium ${textMuted}`}>{tglValue ? new Date(tglValue).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"} WIB</div>
                          </td>
                          <td className="p-5 min-w-[200px]">
                            <div className="text-sm font-bold text-indigo-400">{item.tipe_layanan?.toUpperCase() || "KILOAN"}</div>
                            <div className="text-xs opacity-80 mt-1">{item.paket_layanan || "Reguler"}</div>
                          </td>
                          <td className="p-5 min-w-[150px]">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.status_pembayaran === 'Lunas' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.status_pembayaran}</span>
                          </td>
                          <td className="p-5 text-center align-middle min-w-[150px]">
                            <span className={`px-3 py-1.5 font-bold rounded-lg text-[11px] tracking-wider uppercase block w-max mx-auto ${item.status_logistik === 'selesai' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>{item.status_logistik}</span>
                          </td>
                          <td className="p-5 text-center align-middle min-w-[150px]">
                            {item.status_logistik === 'Siap Kirim' ? (
                              <button onClick={(e) => { e.stopPropagation(); bukaModalFoto(item.id, item.customer_name); }} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-80 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg transition-all active:scale-95 border border-white/20">Selesaikan 🚀</button>
                            ) : item.status_logistik === 'selesai' ? (
                              <button onClick={(e) => { e.stopPropagation(); lihatFotoBukti(item.id); }} className={`text-xs font-bold px-3 py-2 rounded-lg transition-all ${glassPanel} hover:bg-white/10`}>👁️ Cek Foto</button>
                            ) : (
                              <div className="text-xs opacity-50">Berjalan...</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start snap-x snap-mandatory">
                {KANBAN_COLUMNS.map(col => (
                  <div key={col} className={`min-w-[280px] md:min-w-[320px] max-h-full flex flex-col bg-black/10 dark:bg-black/40 rounded-2xl p-3 border border-white/5 shadow-inner snap-center transition-colors`}>
                    <div className="flex justify-between items-center mb-3 px-2 border-b border-white/10 pb-2 shrink-0">
                      <h3 className="font-extrabold text-sm tracking-wide text-indigo-200 uppercase">{col}</h3>
                      <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full font-bold">
                        {dataTersaring.filter(i => i.status_logistik === col || (col === "Antrean" && i.status_logistik === "pickup")).length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
                      {dataTersaring.filter(i => i.status_logistik === col || (col === "Antrean" && i.status_logistik === "pickup")).map((item) => {
                        const currentIndex = KANBAN_COLUMNS.indexOf(item.status_logistik === 'pickup' ? 'Antrean' : item.status_logistik);
                        const nextStatus = currentIndex !== -1 && currentIndex < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[currentIndex + 1] : null;

                        return (
                          <div key={item.id} onClick={() => setDetailPesanan(item)} className={`p-4 rounded-xl relative ${glassPanel} cursor-pointer hover:border-indigo-400/50 transition-all shadow-md group`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-[10px] font-bold mb-1 opacity-60">#{item.id}</div>
                                <h4 className="text-base font-bold leading-tight">{item.customer_name}</h4>
                              </div>
                              {/* Contoh Tombol Lunasi di dalam Card Pesanan */}
                              {item.status_pembayaran !== 'Lunas' && (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    bukaModalLunasi(item); 
                                  }} 
                                  // 💡 PERUBAHAN: Menghapus 'w-full', mengganti ke 'w-fit', memperkecil padding (px-2 py-1), dan ukuran teks (text-[10px])
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-md text-[10px] font-bold transition-all mt-2 w-fit flex items-center gap-1 shadow-sm"
                                >
                                  💰 Konfirmasi Pelunasan
                                </button>
                              )}
                            </div>
                            
                            <div className="text-[11px] bg-black/20 p-2 rounded-lg mb-2 border border-white/5 text-slate-300 font-medium">
                              <span className="block text-indigo-300 font-bold mb-1">{item.paket_layanan}</span>
                              🚚 {item.metode_pengiriman || "Driver"}
                            </div>
                            
                            <div className="mt-3 border-t border-white/10 pt-3">
                              {col !== "Siap Kirim" && col !== "selesai" && nextStatus ? (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] opacity-60">Operasional:</span>
                                  <button onClick={(e) => { e.stopPropagation(); perbaruiStatusPesanan(item.id, nextStatus); }} className="bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm">
                                    Lanjut ke {nextStatus} ➡️
                                  </button>
                                </div>
                              ) : col === "Siap Kirim" ? (
                                // 💡 PERUBAHAN OPSI 1: Logika Tombol Dinamis
                                <button 
                                  onClick={(e) => { e.stopPropagation(); bukaModalFoto(item.id, item.customer_name); }} 
                                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg border border-white/20"
                                >
                                  {item.metode_pengiriman === "Pickup di Toko Sendiri" 
                                    ? "📸 Customer Sudah Ambil" 
                                    : "📸 Selesaikan & Upload Bukti"
                                  }
                                </button>
                              ) : col === "selesai" ? (
                                <button onClick={(e) => { e.stopPropagation(); lihatFotoBukti(item.id); }} className="w-full py-2 rounded-lg text-xs font-bold transition-all bg-white/5 border border-white/10 hover:bg-white/10">👁️ Cek Bukti Selesai</button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL PELUNASAN PESANAN */}
      {isLunasModalOpen && orderYangDilunasi && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                💰 Konfirmasi Pelunasan
              </h2>
              <button 
                onClick={() => setIsLunasModalOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
                disabled={isSubmittingLunas}
              >
                ✕
              </button>
            </div>

            <div className="bg-black/40 rounded-xl p-4 mb-5 border border-white/5">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Total Tagihan:</p>
              <p className="text-3xl font-black text-emerald-400">
                Rp {orderYangDilunasi.total_harga?.toLocaleString("id-ID")}
              </p>
              <p className="text-sm mt-2 text-gray-300">
                Customer: <span className="font-bold text-white">{orderYangDilunasi.customer_name}</span>
              </p>
            </div>

            <form onSubmit={handleSubmitPelunasan} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Lampirkan Bukti Transfer / Pembayaran
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFileBuktiLunas(e.target.files ? e.target.files[0] : null)}
                  required
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 file:transition-all cursor-pointer bg-black/20 rounded-xl border border-white/10"
                />
                {fileBuktiLunas && (
                  <p className="mt-2 text-xs text-emerald-400 font-medium">✓ File siap diunggah: {fileBuktiLunas.name}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsLunasModalOpen(false)} 
                  className="flex-1 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all text-gray-300"
                  disabled={isSubmittingLunas}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!fileBuktiLunas || isSubmittingLunas}
                  className="flex-1 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmittingLunas ? (
                     <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : "Simpan & Lunasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PESANAN */}
      {detailPesanan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4" onClick={() => setDetailPesanan(null)}>
          <div className={`rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] ${glassPanel} border-white/20 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/10 border-b border-white/10 p-5 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2">📄 Detail Pesanan <span className="bg-white/20 text-xs px-2 py-1 rounded-md">#{detailPesanan.id}</span></h2>
              <button onClick={() => setDetailPesanan(null)} className="opacity-70 hover:opacity-100 text-2xl active:scale-90">×</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                <h4 className="text-xs font-bold opacity-60 border-b border-white/10 pb-2 mb-3 w-full">🏷️ Label Tag Keranjang Pelacakan (Anti-Tertukar)</h4>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=LND-${detailPesanan.id}`} alt="Barcode Tag" className="w-24 h-24 object-contain bg-white p-1 rounded-xl shadow" />
                <p className="text-[11px] font-mono mt-1.5 text-indigo-300">TAG-ID: LND-{String(detailPesanan.id).padStart(4, '0')}</p>
                <button type="button" onClick={() => Swal.fire('Printing...', 'Mengirim sinyal cetak barcode ke Printer Thermal Bluetooth...', 'info')} className="mt-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-xs font-bold border border-white/10">🖨️ Print Label Baju</button>
              </div>

              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">Nama Pelanggan</p>
                  <h3 className="text-2xl font-black text-indigo-300">{detailPesanan.customer_name}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 font-bold rounded text-[10px] uppercase ${detailPesanan.status_pembayaran === 'Lunas' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{detailPesanan.status_pembayaran}</span>
                  {detailPesanan.status_pembayaran !== 'Lunas' && <button onClick={() => lunasiPesananInstant(detailPesanan.id)} className="text-xs bg-emerald-600 px-2 py-1 rounded font-bold">Lunasi Sekarang 💵</button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-3 rounded-xl border border-white/5"><p className="text-[10px] opacity-60 font-bold mb-1">Layanan & Paket</p><p className="text-xs font-bold text-emerald-400">{detailPesanan.tipe_layanan?.toUpperCase() || "KILOAN"}</p><p className="text-xs opacity-90 mt-0.5">{detailPesanan.paket_layanan}</p></div>
                <div className="bg-black/20 p-3 rounded-xl border border-white/5"><p className="text-[10px] opacity-60 font-bold mb-1">Metode Pengiriman</p><p className="text-xs font-bold">🚚 {detailPesanan.metode_pengiriman || "Driver"}</p></div>
              </div>
              {detailPesanan.rincian_item && Object.entries(detailPesanan.rincian_item).filter(([k, v]: any) => v > 0).length > 0 && (
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-3 border-b border-white/10 pb-2">Rincian Item Pakaian</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {Object.entries(detailPesanan.rincian_item)
                      .filter(([key, value]: any) => value > 0)
                      .map(([key, value]: any) => (
                        <div key={key} className="bg-white/5 flex flex-col items-center justify-center py-2 px-1 rounded-lg border border-white/10 shadow-inner">
                          <span className="text-2xl mb-1">{key}</span>
                          <span className="text-[11px] font-bold text-indigo-200">{value} <span className="opacity-50 text-[9px] font-normal">pcs</span></span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold opacity-60 border-b border-white/10 pb-2">Rincian Pembayaran</h4>
                <div className="flex justify-between items-center text-sm"><span className="opacity-80">Berat / Qty:</span><span className="font-bold">{detailPesanan.berat_pesanan_kg} {detailPesanan.tipe_layanan === 'satuan' ? 'Pcs' : 'KG'}</span></div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10"><span className="font-bold text-indigo-300">Total Harga:</span><span className="text-xl font-black text-emerald-400">Rp {Number(detailPesanan.total_harga || 0).toLocaleString("id-ID")}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POS KASIR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className={`rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] ${glassPanel} border-white/20 shadow-2xl`}>
            <div className="bg-white/10 border-b border-white/10 p-5 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg">🛍️ POS Kasir LaundroAI</h2>
              <button onClick={() => setIsModalOpen(false)} className="opacity-70 hover:opacity-100 text-2xl">×</button>
            </div>
            
            <form onSubmit={handleTambahPesanan} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/20 border border-white/5">
                <button type="button" onClick={() => setFormData({...formData, tipe_layanan: "kiloan", harga_per_unit: "7000", berat_pesanan_kg: ""})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.tipe_layanan === "kiloan" ? "bg-blue-600 text-white shadow" : "opacity-60"}`}>🧺 Kiloan</button>
                <button type="button" onClick={() => setFormData({...formData, tipe_layanan: "satuan", harga_per_unit: "15000", berat_pesanan_kg: ""})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.tipe_layanan === "satuan" ? "bg-purple-600 text-white shadow" : "opacity-60"}`}>👔 Satuan</button>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 opacity-80">Paket Layanan</label>
                <select value={formData.paket_layanan} onChange={(e) => setFormData({...formData, paket_layanan: e.target.value})} className={`w-full py-3 px-4 rounded-xl outline-none appearance-none cursor-pointer ${glassInput}`}>
                  <option value="Cuci Kering Setrika Lipat" className="text-black">Cuci Kering Setrika Lipat 👔</option>
                  <option value="Cuci Kering Lipat" className="text-black">Cuci Kering Lipat 🧺</option>
                  <option value="Cuci Kilat" className="text-black">Cuci Kilat (Express) ⚡</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 opacity-80">Metode Pengiriman</label>
                <select value={formData.metode_pengiriman} onChange={(e) => setFormData({...formData, metode_pengiriman: e.target.value})} className={`w-full py-3 px-4 rounded-xl outline-none appearance-none cursor-pointer ${glassInput}`}>
                  <option value="Diantar Driver Internal" className="text-black">Metode: Diantar Driver Internal 🛵</option>
                  <option value="Pickup di Toko Sendiri" className="text-black">Metode: Customer Ambil Sendiri (Pickup) 🏪</option>
                  <option value="GoSend / GrabExpress" className="text-black">Metode: GoSend / GrabExpress 📦</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-bold mb-1 opacity-80">Nama Pelanggan</label>
                <input type="text" required value={formData.customer_name} onChange={(e) => { setFormData({...formData, customer_name: e.target.value}); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className={`w-full py-3 px-4 rounded-xl outline-none transition-all ${glassInput}`} placeholder="Ketik nama pelanggan..." />
                {showSuggestions && formData.customer_name && customers.filter(c => c.name.toLowerCase().includes(formData.customer_name.toLowerCase())).length > 0 && (
                  <ul className="absolute z-50 w-full mt-2 rounded-xl max-h-48 overflow-y-auto backdrop-blur-2xl bg-gray-900/90 border border-white/10 shadow-2xl text-white">
                    {customers.filter(c => c.name.toLowerCase().includes(formData.customer_name.toLowerCase())).map(c => (
                      <li key={c.id} onClick={() => { setFormData({...formData, customer_name: c.name, alamat_detail: c.alamat_detail, jarak_ke_toko_km: c.jarak_ke_toko_km}); setShowSuggestions(false); }} className="px-4 py-3 cursor-pointer text-sm font-bold border-b border-white/5 last:border-b-0 hover:bg-white/10 transition-colors">{c.name} <span className="block text-xs font-normal opacity-60 truncate">{c.alamat_detail}</span></li>
                    ))}
                  </ul>
                )}
              </div>

              <div><label className="block text-sm font-bold mb-1 opacity-80">Alamat Lengkap</label><textarea required value={formData.alamat_detail} onChange={(e) => setFormData({...formData, alamat_detail: e.target.value})} className={`w-full px-4 py-3 rounded-xl outline-none ${glassInput}`} rows={2}></textarea></div>
              
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                  Rincian Item Pakaian <span className="text-[9px] opacity-70 normal-case">(Opsional utk Kiloan, Wajib utk Satuan)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(rincianItem).map((key) => (
                    <div key={key} className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="text-xl md:text-2xl px-2">{key}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleRincianChange(key as keyof typeof rincianItem, -1)} className="w-6 h-6 rounded-md bg-red-500/20 text-red-400 font-bold flex items-center justify-center hover:bg-red-500/40 transition-colors">-</button>
                        <span className="text-sm font-bold w-4 text-center">{rincianItem[key as keyof typeof rincianItem]}</span>
                        <button type="button" onClick={() => handleRincianChange(key as keyof typeof rincianItem, 1)} className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center hover:bg-emerald-500/40 transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-300">
                    {formData.tipe_layanan === "kiloan" ? "⚖️ Berat (KG)" : "🔢 Total Qty (Pcs - Otomatis)"}
                  </label>
                  <input 
                    type="number" 
                    step={formData.tipe_layanan === "kiloan" ? "0.1" : "1"} 
                    required 
                    placeholder="0" 
                    value={formData.berat_pesanan_kg} 
                    onChange={(e) => {
                      if(formData.tipe_layanan === 'kiloan') {
                        setFormData({...formData, berat_pesanan_kg: e.target.value})
                      }
                    }} 
                    readOnly={formData.tipe_layanan === "satuan"}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl outline-none ${formData.tipe_layanan === "satuan" ? 'cursor-not-allowed opacity-70' : ''} ${glassInput}`} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-300">💰 Harga per Unit</label>
                  <input 
                    type="number" 
                    required 
                    readOnly 
                    value={formData.harga_per_unit} 
                    className={`w-full px-4 py-2.5 text-sm rounded-xl outline-none cursor-not-allowed opacity-70 ${glassInput}`} 
                  />
                </div>
              </div>

              <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">Metode Finansial Pelanggan</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Lunas", "DP", "Belum Bayar"].map((status) => (
                    <button key={status} type="button" onClick={() => setFormData({...formData, status_pembayaran: status})} className={`py-2 rounded-xl text-xs font-bold border transition-all ${formData.status_pembayaran === status ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-white/5 border-white/10 opacity-70'}`}>{status}</button>
                  ))}
                </div>
                {formData.status_pembayaran === "DP" && (
                  <div><label className="block text-[11px] opacity-70 mb-1">Nominal DP Kontan (Rp):</label><input type="number" value={formData.jumlah_dp} onChange={(e) => setFormData({...formData, jumlah_dp: e.target.value})} className={`w-full px-3 py-2 text-xs rounded-lg ${glassInput}`} placeholder="Masukkan nilai uang DP..." /></div>
                )}
              </div>

              {formData.total_harga > 0 && formData.status_pembayaran === "Lunas" && (
                <div className="p-4 bg-white rounded-2xl shadow flex flex-col items-center">
                  <p className="text-xs text-slate-800 font-extrabold mb-2">📲 SCAN QRIS LAUNDROAI</p>
                  <img src="/qris.jpg" alt="QRIS Universal" className="w-32 h-32 object-contain border rounded-lg" />
                  <p className="text-lg font-black text-emerald-600 mt-2">Rp {formData.total_harga.toLocaleString("id-ID")}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 text-center">Minta pelanggan memasukkan nominal secara manual.</p>
                </div>
              )}

              <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 p-4 rounded-2xl border border-indigo-500/20 flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-300">Total Tagihan:</span>
                <span className="text-2xl font-black text-emerald-400">Rp {formData.total_harga.toLocaleString("id-ID")}</span>
              </div>

              {formData.status_pembayaran !== "Belum Bayar" ? (
                <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-2xl p-4">
                  <label className="block text-sm font-bold mb-3 text-emerald-300">📸 Lampirkan Bukti Transaksi POS</label>
                  {paymentPreviewUrl ? (
                    <div className="w-full h-32 bg-black/20 rounded-xl overflow-hidden border border-white/20 relative">
                      <img src={paymentPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <input type="file" accept="image/*" capture="environment" onChange={handlePilihFotoPembayaran} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  ) : (
                    <div className="w-full h-20 bg-white/5 rounded-xl border-2 border-dashed border-emerald-500/30 flex flex-col items-center justify-center text-emerald-400 hover:bg-emerald-500/10 relative cursor-pointer">
                      <span className="font-bold text-xs">📷 Upload Foto Bukti Transfer / QRIS / Cash</span>
                      <input type="file" accept="image/*" capture="environment" required onChange={handlePilihFotoPembayaran} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-amber-500/30 bg-amber-900/10 rounded-2xl p-4 text-center">
                  <span className="text-amber-400 font-bold text-xs leading-relaxed block">⚠️ Pesanan berstatus BELUM BAYAR.<br/>Fitur lampiran wajib bukti transaksi dinonaktifkan sementara.</span>
                </div>
              )}

              <div className="pt-2 flex gap-3 pb-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || formData.total_harga <= 0} 
                  className={`flex-1 font-bold py-3 rounded-xl border border-white/20 shadow-lg text-white transition-all ${
                    formData.total_harga <= 0 
                      ? 'bg-gray-600/50 opacity-50 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90'
                  }`}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan & Kirim Nota 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUKTI PENGIRIMAN SECURITY LOCK */}
      {isPhotoModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[80] p-4">
          <div className={`rounded-3xl w-full max-w-sm overflow-hidden ${glassPanel} border-white/20 shadow-2xl text-white`}>
            <div className="bg-red-500/20 border-b border-red-500/30 p-5 flex justify-between items-center">
              <h2 className="font-bold text-lg text-red-200">📸 Wajib Bukti Pengantaran</h2>
              <button onClick={() => setIsPhotoModalOpen(false)} className="opacity-70 hover:opacity-100 text-2xl">×</button>
            </div>
            <form onSubmit={kirimBuktiSelesai} className="p-6 text-center">
              <p className={`mb-4 text-xs text-red-300 font-medium`}>Akses Ditahan! Unggah bukti dokumentasi serah terima pakaian dengan <strong>{selectedOrder.customer_name}</strong> untuk menutup transaksi.</p>
              {livePreviewUrl ? (
                <div className="mb-6 w-full aspect-square bg-black/20 rounded-2xl overflow-hidden border border-white/20 flex items-center justify-center relative">
                  <img src={livePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <input type="file" accept="image/*" capture="environment" onChange={handlePilihFotoPengiriman} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              ) : (
                <div className="mb-6 w-full aspect-square bg-white/5 rounded-2xl border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center text-red-400 hover:bg-white/10 relative cursor-pointer">
                  <span className="text-4xl mb-2">📦</span><span className="font-bold text-sm">Ambil Foto Pakaian</span>
                  <input type="file" accept="image/*" capture="environment" required onChange={handlePilihFotoPengiriman} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              )}
              <button type="submit" disabled={isUploadingPhoto || !deliveryPhoto} className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 border border-white/20 shadow-lg">
                {isUploadingPhoto ? "🚀 Mengirim Data..." : "Buka Kunci & Selesaikan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH CUSTOMER BARU */}
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
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className={`flex-1 font-bold py-3 rounded-xl transition-all bg-black/10 hover:bg-black/20 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10`}>Batal</button>
                <button type="submit" disabled={isSubmittingCustomer} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 font-bold py-3 rounded-xl hover:opacity-90 border border-white/20 text-white shadow-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW FOTO BUKTI */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-lg relative flex flex-col items-center">
            <button onClick={() => setIsPreviewOpen(false)} className="absolute -top-12 right-0 text-white opacity-60 hover:opacity-100 font-bold text-3xl">×</button>
            <h3 className="text-white font-bold mb-4 opacity-80 tracking-widest text-sm">DOKUMENTASI SERAH TERIMA</h3>
            <div className="w-full aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
              <img src={previewTargetUrl} alt="Bukti" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP DETAIL KALENDER INCOME */}
      {isCalendarModalOpen && selectedDateDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4" onClick={() => setIsCalendarModalOpen(false)}>
          <div className={`rounded-3xl w-full max-w-sm p-6 ${glassPanel} border-white/20 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
              <h2 className="font-bold text-lg text-indigo-300">📅 Rincian Tgl {selectedDateDetails.tanggal} {namaBulan[calendarMonth]}</h2>
              <button onClick={() => setIsCalendarModalOpen(false)} className="opacity-70 hover:opacity-100 text-xl">×</button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] opacity-70 font-bold uppercase mb-1">Total Pendapatan</p>
                <p className="text-2xl font-black text-emerald-400">Rp {selectedDateDetails.totalIncome.toLocaleString("id-ID")}</p>
                <p className="text-xs mt-1 text-slate-300">Dari <span className="font-bold text-white">{selectedDateDetails.jumlahTransaksi}</span> transaksi customer</p>
              </div>
              
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] opacity-70 font-bold uppercase mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-black text-red-400">Rp {selectedDateDetails.totalPengeluaran.toLocaleString("id-ID")}</p>
                
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <p className="text-[10px] opacity-70 font-bold uppercase">Deskripsi Pengeluaran:</p>
                  {selectedDateDetails.listPengeluaran.length > 0 ? (
                    selectedDateDetails.listPengeluaran.map((ex: any) => (
                      <div key={ex.id} className="flex flex-col text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className="font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                            {ex.kategori}
                          </span>
                          <span className="font-bold text-red-300 whitespace-nowrap">
                            Rp {Number(ex.nominal).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <span className="opacity-80 mt-1">{ex.deskripsi}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic opacity-50 bg-white/5 p-2 rounded-lg">Tidak ada catatan pengeluaran.</p>
                  )}
                </div>
              </div>
            </div>
            
            <button onClick={() => setIsCalendarModalOpen(false)} className="w-full mt-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-all">Tutup Rincian</button>
          </div>
        </div>
      )}
  

      {/* MODAL PENGATURAN TOKO */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl font-bold transition-all">✕</button>
            <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-2">⚙️ Pengaturan Toko</h2>

            <div className="overflow-y-auto pr-1">
              {isOwnerMode ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-5 rounded-2xl border border-blue-500/20 text-left">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">🏪 Profil Toko (Kop Nota)</h3>
                    <p className="text-[10px] text-white/50 mb-3">Teks ini akan otomatis tercetak sebagai Header pada nota Telegram.</p>
                    <form onSubmit={handleSimpanProfilToko} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-white/70 uppercase font-bold">Nama Toko</label>
                        <input type="text" value={namaToko} onChange={e => setNamaToko(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 transition-all" required />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/70 uppercase font-bold">Alamat & Kontak (Opsional)</label>
                        <textarea value={kontakToko} onChange={e => setKontakToko(e.target.value)} placeholder="Cth: Jl. Sudirman No. 1 | WA: 08123456" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 transition-all" rows={2} />
                      </div>

                      {/* AREA PENGATURAN PIN YANG SUDAH DIRAPIKAN */}
                      <div className="pt-3 mt-2 border-t border-white/10">
                        <p className="text-[10px] text-white/50 mb-3 uppercase font-bold tracking-wider">🔐 Pengaturan Keamanan (PIN)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-white/70 uppercase font-bold mb-1 block">PIN Owner</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              value={storePins.owner} 
                              onChange={e => setStorePins({...storePins, owner: e.target.value.replace(/\D/g, '')})} 
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-purple-300 text-sm outline-none focus:border-purple-500 tracking-[0.5em] font-mono text-center transition-all" 
                              placeholder="111111"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/70 uppercase font-bold mb-1 block">PIN Kasir</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              value={storePins.kasir} 
                              onChange={e => setStorePins({...storePins, kasir: e.target.value.replace(/\D/g, '')})} 
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-emerald-300 text-sm outline-none focus:border-emerald-500 tracking-[0.5em] font-mono text-center transition-all" 
                              placeholder="123456"
                            />
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={isUpdatingToko} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg">
                        {isUpdatingToko ? "Menyimpan..." : "💾 Simpan Profil & Keamanan"}
                      </button>
                    </form>
                  </div>
                  
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
                    <p className="text-sm text-white/70 mb-3">Kode Rahasia Toko Anda:</p>
                    <div className="flex flex-col gap-3">
                      <code className="block bg-black/50 text-emerald-400 p-3 rounded-xl font-mono text-sm break-all border border-emerald-500/30">
                        {sessionStorage.getItem("laundro_store_id") || "Memuat kode..."}
                      </code>
                      <button 
                        onClick={() => {
                          const kode = sessionStorage.getItem("laundro_store_id");
                          if (kode) {
                            navigator.clipboard.writeText(kode);
                            Swal.fire({ icon: 'success', title: 'Tersalin!', text: 'Kode berhasil disalin.', timer: 1500, showConfirmButton: false });
                          }
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all"
                      >
                        <span>📋</span> Salin Kode Toko
                      </button>
                    </div>
                    <p className="text-xs text-white/50 mt-4">Berikan kode ini ke pegawai Anda.</p>
                  </div>

                  <div className="bg-black/30 p-4 rounded-xl border border-white/10 text-left">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">👥 Slot Pegawai (Kasir)</h3>
                    {kasirId ? (
                      <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">🧑‍💻</div>
                          <div>
                            <p className="text-sm font-bold text-white">Kasir Aktif</p>
                            <p className="text-[10px] text-emerald-400">Terhubung</p>
                          </div>
                        </div>
                        <button onClick={handlePecatKasir} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all border border-red-500/30">
                          Cabut Akses
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <span className="text-2xl mb-2 opacity-50">🪑</span>
                        <p className="text-xs text-white/50 mt-2">Slot kasir masih kosong.<br/>Bagikan kode di atas ke pegawai Anda.</p>
                      </div>
                    )}
                  </div>
                  
                </div>
              ) : (
                <form onSubmit={handleGabungToko} className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-4">
                    <p className="text-sm text-blue-200">Minta <b>Kode Toko</b> dari Owner Anda, lalu tempelkan di bawah ini.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-2 uppercase tracking-wider">Kode Referal Toko</label>
                    <input 
                      type="text" 
                      value={inputKodeToko} 
                      onChange={(e) => setInputKodeToko(e.target.value)}
                      placeholder="Contoh: 123e4567..." 
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:opacity-90 transition-all">
                    🔗 Gabung ke Toko
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}