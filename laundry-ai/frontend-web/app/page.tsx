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

// 🔐 CUSTOM PIN 6-ANGKA UNTUK MENU RAHASIA
const SECURITY_PIN = "111111"; 

const defaultMapCenter = { lat: -6.2088, lng: 106.8456 }; 
const mapContainerStyle = { width: "100%", height: "600px", borderRadius: "16px" };

export default function Dashboard() {
  const router = useRouter();

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // STATE KEAMANAN (SECURITY LOCK)
  const [isSecureUnlocked, setIsSecureUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pendingMenu, setPendingMenu] = useState("");
  
  const [sortBy, setSortBy] = useState<"terbaru" | "terdekat">("terbaru");
  const [filterTanggal, setFilterTanggal] = useState<string>(""); 
  const [filterTanggalPengeluaran, setFilterTanggalPengeluaran] = useState<string>("");

  // STATE KALENDER PENDAPATAN
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

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
  
  const defaultRincian = { baju: 0, celana: 0, kemeja: 0, jaket: 0, celana_dalam: 0, kaos_kaki: 0, dasi: 0 };
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

  // LOGIKA PENGHITUNGAN TOTAL HARGA & QTY OTOMATIS
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

  // FUNGSI TOGGLE PLUS/MINUS BAJU DLL
  const handleRincianChange = (item: keyof typeof rincianItem, delta: number) => {
    setRincianItem(prev => {
      const newValue = prev[item] + delta;
      return { ...prev, [item]: Math.max(0, newValue) }; // Mencegah nilai minus
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

  // ==========================================
  // FUNGSI PENCATATAN AKTIVITAS (AUDIT LOG)
  // ==========================================
  const catatLog = async (action: string, details: string) => {
    try { await supabase.from("audit_logs").insert([{ action, details }]); } catch (error) { console.error("Gagal mencatat log", error); }
  };

  // ==========================================
  // MANAJEMEN MENU & SECURITY LOCK
  // ==========================================
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
      setIsPinModalOpen(false);
      setActiveMenu(pendingMenu);
      setInputPin("");
      catatLog("Security Unlock", `Berhasil membuka menu terkunci (${pendingMenu})`);
    } else {
      alert("❌ PIN Salah! Akses Ditolak.");
      setInputPin("");
      catatLog("Security Breach", `Percobaan akses ilegal ke menu ${pendingMenu} dengan PIN yang salah.`);
    }
  };

  // ==========================================
  // KANBAN GUARDRAILS + SMART AUTOMATION
  // ==========================================
  const KANBAN_COLUMNS = ["Antrean", "Sedang Dicuci", "Disetrika", "Packing", "Siap Kirim", "selesai"];

  const perbaruiStatusPesanan = async (id: number, newStatus: string) => {
    const orderLama = pesanan.find(p => p.id === id);
    if (!orderLama) return;

    if ((newStatus === "Siap Kirim" || newStatus === "selesai") && orderLama.status_pembayaran !== "Lunas") {
       alert(`🛑 AKSES DIBLOKIR: Pesanan Pelanggan "${orderLama.customer_name}" berstatus [${orderLama.status_pembayaran}]. Selesaikan pelunasan kasir terlebih dahulu sebelum lanjut kirim baju!`);
       return;
    }

    if (newStatus === "selesai") {
      bukaModalFoto(id, orderLama.customer_name);
      return; 
    }

    setPesanan(prev => prev.map(p => p.id === id ? { ...p, status_logistik: newStatus } : p));
    const { error } = await supabase.from("orders").update({ status_logistik: newStatus }).eq("id", id);
    if (error) { alert("Gagal memperbarui status!"); ambilData(); return; }

    catatLog("Update Status", `Pesanan #${id} (${orderLama.customer_name}) dipindah ke [${newStatus}]`);
    if (newStatus === "Siap Kirim" && orderLama.status_logistik !== "Siap Kirim") kirimNotifSiapKirim(orderLama);
  };

  const lunasiPesananInstant = async (id: number) => {
    setPesanan(prev => prev.map(p => p.id === id ? { ...p, status_pembayaran: "Lunas" } : p));
    if(detailPesanan && detailPesanan.id === id) setDetailPesanan((prev: any) => ({ ...prev, status_pembayaran: "Lunas" }));
    
    const { error } = await supabase.from("orders").update({ status_pembayaran: "Lunas" }).eq("id", id);
    if (error) { alert("Gagal melunasi transaksi!"); ambilData(); }
    else { 
      catatLog("Pelunasan", `Kasir melunasi pesanan #${id} secara instan di papan operasional.`);
      alert("🎉 Pembayaran dikonfirmasi LUNAS! Papan operasional terbuka kembali."); 
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
      if (!session) router.push("/login");
      else { setSession(session); ambilData(); }
      setLoading(false);
    }
    cekKeamanan();
  }, [router]);

  async function ambilData() {
    // Tarik Semua Data dari Supabase
    const { data: ordersData } = await supabase.from("orders").select("*").order("id", { ascending: false });
    if (Array.isArray(ordersData)) setPesanan(ordersData);
    
    const { data: customersData } = await supabase.from("customers").select("*").order("name", { ascending: true });
    if (Array.isArray(customersData)) setCustomers(customersData);

    const { data: expData } = await supabase.from("expenses").select("*").order("id", { ascending: false });
    if (Array.isArray(expData)) setPengeluaran(expData);

    const { data: logData } = await supabase.from("audit_logs").select("*").order("id", { ascending: false }).limit(300);
    if (Array.isArray(logData)) setAuditLogs(logData);

    // Ambil Stok Terbaru Langsung dari Database Supabase
    const { data: invData } = await supabase.from("inventory").select("*").eq("id", 1).maybeSingle();
    if (invData) {
      setInventory({ deterjen: invData.deterjen, parfum: invData.parfum, plastik: invData.plastik });
    }
  }

  async function handleLogout() {
    catatLog("Logout", "Admin/Kasir keluar dari sistem.");
    await supabase.auth.signOut(); router.push("/login");
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
    if (buktiFotoUrls[idPesanan]) { setPreviewTargetUrl(buktiFotoUrls[idPesanan]); setIsPreviewOpen(true); } 
    else { alert("📱 Foto bukti pengiriman lama tidak disimpan di server untuk menghemat memori. Silakan cek langsung di Telegram."); }
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
      alert(`🎉 Pengiriman Berhasil!`);
    } catch (err) { alert("Gagal memproses penyelesaian."); } 
    finally { setIsUploadingPhoto(false); setIsPhotoModalOpen(false); setSelectedOrder(null); setDeliveryPhoto(null); setLivePreviewUrl(null); }
  }

  // ==========================================
  // FITUR SIMPAN PENGELUARAN BARU + STOK INVENTORY PERMANEN
  // ==========================================
  async function handleSimpanPengeluaran(e: React.FormEvent) {
    e.preventDefault();
    if (!formPengeluaran.nominal) return;
    
    if (!fotoStruk) {
      alert("⚠️ Harap unggah foto struk/bon pengeluaran terlebih dahulu!"); 
      return;
    }

    try {
      const { error } = await supabase.from("expenses").insert([{
        kategori: formPengeluaran.kategori,
        deskripsi: formPengeluaran.deskripsi,
        nominal: Number(formPengeluaran.nominal),
        created_at: new Date().toISOString()
      }]);
      
      if (error) throw new Error(error.message);

      let infoRestockTelegram = "";
      const matchAngka = formPengeluaran.deskripsi.match(/\d+/);
      const qtyDitemukan = matchAngka ? parseInt(matchAngka[0], 10) : 0;

      // UPDATE STOK LANGSUNG KE DATABASE SUPABASE JIKA KATEGORI RESTOCK
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
        
        await supabase.from("inventory").update(updatedInv).eq("id", 1);
      }
      
      const pesanCaption = `💸 *PENGELUARAN BARU*\n\n📌 *Kategori:* ${formPengeluaran.kategori}\n📝 *Ket:* ${formPengeluaran.deskripsi}\n💰 *Nominal:* Rp ${Number(formPengeluaran.nominal).toLocaleString('id-ID')}${infoRestockTelegram}`;
      
      const fileData = new FormData();
      fileData.append("chat_id", chatId); 
      fileData.append("photo", fotoStruk); 
      fileData.append("caption", pesanCaption); 
      fileData.append("parse_mode", "Markdown");

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, { method: "POST", body: fileData });

      catatLog("Uang Keluar", `Kategori: ${formPengeluaran.kategori} | Rp ${Number(formPengeluaran.nominal).toLocaleString('id-ID')} | Ket: ${formPengeluaran.deskripsi}`);
      alert("✅ Pengeluaran operasional & struk berhasil dicatat!");
      
      setFormPengeluaran({ kategori: "Listrik (Token/Pasca)", deskripsi: "", nominal: "" });
      setFotoStruk(null);
      setPreviewStrukUrl(null);
      ambilData(); // Akan otomatis menarik data inventaris terbaru dari Supabase
    } catch (err: any) { 
      alert("Gagal menyimpan pengeluaran: " + err.message); 
    }
  }

  // ==========================================
  // SIMPAN PESANAN BARU + POTONG STOK PERMANEN
  // ==========================================
  async function handleTambahPesanan(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.status_pembayaran !== "Belum Bayar" && !paymentPhoto) {
      alert("⚠️ Harap unggah foto bukti transaksi pembayaran (Transfer/QRIS/Cash) terlebih dahulu!"); return;
    }
    setIsSubmitting(true);
    
    try {
      const { data: newOrderData, error } = await supabase.from("orders").insert([
        { 
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

      // POTONG STOK SECARA PERMANEN DI SUPABASE KETIKA ADA PESANAN CUSTOMER
      const berat = Number(formData.berat_pesanan_kg) || 1;
      const nDet = Math.max(0, inventory.deterjen - Math.round(berat * 50));
      const nPar = Math.max(0, inventory.parfum - Math.round(berat * 20));
      const nPlas = Math.max(0, inventory.plastik - 1);
      
      await supabase.from("inventory").update({ deterjen: nDet, parfum: nPar, plastik: nPlas }).eq("id", 1);

      if (nDet < 1000 || nPar < 500 || nPlas < 10) {
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: `⚠️ *DARURAT INVENTARIS* Stok menipis. Segera restock!`, parse_mode: "Markdown" })
        }).catch(console.error);
      }

      const orderId = newOrderData && newOrderData[0] ? newOrderData[0].id : "BARU";
      catatLog("Pesanan Baru", `Input Order #${orderId} - ${formData.customer_name} (Rp${formData.total_harga}) - Status: ${formData.status_pembayaran}`);

      const notaDigital = `🧾 *NOTA ${formData.status_pembayaran !== 'Belum Bayar' ? '& BUKTI PEMBAYARAN ' : 'PESANAN '}(#${orderId})* 🧾\n👤 *Pelanggan:* ${formData.customer_name}\n💳 *Keuangan:* ${formData.status_pembayaran.toUpperCase()}\n💰 *TOTAL TAGIHAN: Rp ${formData.total_harga.toLocaleString('id-ID')}*`;

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

      setIsModalOpen(false); 
      setFormData({ customer_name: "", alamat_detail: "", jarak_ke_toko_km: "", berat_pesanan_kg: "", latitude: "", longitude: "", tipe_layanan: "kiloan", paket_layanan: "Cuci Kering Setrika Lipat", metode_pengiriman: "Diantar Driver Internal", status_pembayaran: "Lunas", jumlah_dp: "0", harga_per_unit: "7000", total_harga: 0 }); 
      setRincianItem(defaultRincian); setPaymentPhoto(null); setPaymentPreviewUrl(null); 
      ambilData(); // Tarik ulang data stok agar UI kembali sinkron

    } catch (err: any) { alert("Terjadi kesalahan: " + err.message); } 
    finally { setIsSubmitting(false); }
  }

  async function handleTambahCustomer(e: React.FormEvent) {
    e.preventDefault(); setIsSubmittingCustomer(true);
    const { error } = await supabase.from("customers").insert([{ name: customerFormData.name, alamat_detail: customerFormData.alamat_detail, jarak_ke_toko_km: Number(customerFormData.jarak_ke_toko_km) }]);
    setIsSubmittingCustomer(false);
    if (error) alert("Gagal. Error: " + error.message);
    else { 
      catatLog("Pelanggan Baru", `Mendaftarkan pelanggan baru: ${customerFormData.name}`);
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
      alert("Laporan Excel berhasil dikirim ke Telegram! 🚀");
    } catch (err) { alert("Kesalahan sistem."); } finally { setIsExporting(false); }
  }

  // ==========================================
  // FIX LOGIKA KALENDER & PENGELUARAN
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

  // LOGIKA FILTER TANGGAL KHUSUS PENGELUARAN
  const pengeluaranTersaring = pengeluaran.filter(p => {
    if (!filterTanggalPengeluaran) {
      // Jika filter kosong, ikuti default (Bulan Ini)
      if(!p.created_at) return false;
      const d = new Date(p.created_at);
      return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
    }
    // Jika filter diisi, cocokkan dengan tanggal (Format YYYY-MM-DD)
    const tglRaw = p.created_at;
    if (!tglRaw) return false; 
    const d = new Date(tglRaw);
    const itemLocalYYYYMMDD = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return itemLocalYYYYMMDD === filterTanggalPengeluaran;
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

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCards = [];
  for(let i = 1; i <= daysInMonth; i++) {
     calendarCards.push({ tanggal: i, qty: rekapHarian[i]?.qty || 0, total: rekapHarian[i]?.total || 0 });
  }

  const totalBulanQty = calendarCards.reduce((acc, curr) => acc + curr.qty, 0);
  const totalBulanRp = pesananBulanIni.reduce((acc, curr) => acc + Number(curr.total_harga || 0), 0);
  const totalPengeluaranBulanRp = pengeluaranBulanIni.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);
  const labaBersih = totalBulanRp - totalPengeluaranBulanRp;
  
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div></div>;
  if (!session) return null;

  // ==========================================
  // FILTERING DASHBOARD & SORTING
  // ==========================================
  const dataTersaring = [...pesanan]
    .filter((item) => filterStatus === "semua" ? true : item.status_logistik === filterStatus)
    .filter((item) => {
      if (!filterTanggal) return true; // TAMPILKAN SEMUA JIKA FILTER KOSONG
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

      {/* SIDEBAR NAVIGATION BARU */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 flex flex-col justify-between ${glassPanel} border-r border-r-white/10 md:m-4 md:rounded-3xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-white opacity-70 text-2xl font-bold">✕</button>
        <div>
          <div className="p-6 flex items-center gap-3 mt-4 md:mt-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">L</div>
            <div><h2 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">LaundroAI</h2><p className={`text-xs ${textMuted}`}>Micro ERP</p></div>
          </div>
          <nav className="mt-4 px-4 space-y-2">
            {['Dashboard', 'Tracking', 'Database Customers', 'Calendar', 'Inventory', 'Pengeluaran', 'Data Log'].map((menu) => {
              const isLocked = !isSecureUnlocked && ["Calendar", "Pengeluaran", "Data Log"].includes(menu);
              return (
                <button key={menu} onClick={() => handleMenuClick(menu)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${activeMenu === menu ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-white/20" : `${isDarkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-white/40'}`}`}>
                  <div className="flex items-center gap-3">
                    {menu === 'Dashboard' && "📊"} {menu === 'Tracking' && "📍"} {menu === 'Database Customers' && "👥"} {menu === 'Calendar' && "📅"} {menu === 'Inventory' && "📦"} {menu === 'Pengeluaran' && "💸"} {menu === 'Data Log' && "🛡️"}
                    <span className="text-sm truncate max-w-[120px]">
                      {menu === 'Calendar' ? 'Kalender Income' : menu === 'Inventory' ? 'Stok Gudang' : menu}
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

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 pt-20 md:pt-10 scroll-smooth z-10 w-full max-w-full">
        
        {/* MODUL PENGELUARAN */}
        {activeMenu === "Pengeluaran" ? (
          <div className="max-w-7xl mx-auto flex flex-col h-full">
            <h1 className="text-3xl font-extrabold tracking-tight mb-6">Catat Pengeluaran 💸</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`md:col-span-1 p-6 rounded-3xl ${glassPanel} border-t-4 border-red-500 h-fit`}>
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
              <div className={`md:col-span-2 p-6 rounded-3xl ${glassPanel} flex flex-col`}>
  {/* HEADER & FILTER TANGGAL */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/10 pb-3 gap-3">
    <h3 className="font-bold text-lg">Riwayat Pengeluaran</h3>
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 shadow-inner`}>
      <span className="text-xs font-bold opacity-60">📅 Filter:</span>
      <input type="date" value={filterTanggalPengeluaran} onChange={(e) => setFilterTanggalPengeluaran(e.target.value)} className="text-xs font-bold outline-none bg-transparent cursor-pointer" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
      {filterTanggalPengeluaran && <button onClick={() => setFilterTanggalPengeluaran("")} className="text-red-400 hover:text-red-500 ml-1 text-xs font-bold transition-colors">✕</button>}
    </div>
  </div>

  {/* TABEL DATA */}
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
            </div>
          </div>
        ) : activeMenu === "Data Log" ? (
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Audit Trail Log 🛡️</h1>
            <p className="text-sm opacity-60 mb-6">Sistem merekam semua aktivitas user secara real-time untuk mencegah fraud.</p>
            <div className={`flex-1 overflow-auto rounded-3xl ${glassPanel} p-4`}>
              <table className="w-full text-left text-sm">
                <thead className={`${tableHeaderGlass} sticky top-0 z-10 backdrop-blur-xl`}>
                  <tr><th className="p-4 rounded-tl-xl">Waktu (Timestamp)</th><th className="p-4">Jenis Aksi</th><th className="p-4 rounded-tr-xl">Detail Aktivitas</th></tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-black/5'}`}>
                  {auditLogs.map(log => (
                    <tr key={log.id} className={`${rowHover} transition-colors`}>
                      <td className="p-4 whitespace-nowrap text-xs opacity-70 font-mono">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 whitespace-nowrap"><span className="bg-blue-500/10 px-2 py-1 rounded text-xs font-bold text-blue-400 border border-blue-500/20">{log.action}</span></td>
                      <td className="p-4 text-xs font-medium">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeMenu === "Inventory" ? (
          <div className="max-w-7xl mx-auto flex flex-col h-full">
            <div className="mb-6"><h1 className="text-3xl font-extrabold tracking-tight">Stok Gudang 📦</h1></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl ${glassPanel} border-t-4 border-t-blue-500`}><p className="text-sm font-bold opacity-70">🧼 Deterjen Utama</p><p className="text-2xl font-mono text-blue-400">{inventory.deterjen} ml</p></div>
              <div className={`p-6 rounded-2xl ${glassPanel} border-t-4 border-t-purple-500`}><p className="text-sm font-bold opacity-70">🌸 Parfum Premium</p><p className="text-2xl font-mono text-purple-400">{inventory.parfum} ml</p></div>
              <div className={`p-6 rounded-2xl ${glassPanel} border-t-4 border-t-emerald-500`}><p className="text-sm font-bold opacity-70">🛍️ Plastik Packing</p><p className="text-2xl font-mono text-emerald-400">{inventory.plastik} Pcs</p></div>
            </div>
          </div>
        ) : activeMenu === "Calendar" ? (
          <div className="max-w-7xl mx-auto flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
              <div><h1 className="text-3xl font-extrabold tracking-tight">Laporan Laba & Rugi 📅</h1><p className={`text-sm mt-1 ${textMuted}`}>Pantau rekap transaksi dan keuntungan toko bersih harian.</p></div>
              <div className="flex gap-2">
                <select value={calendarMonth} onChange={e => setCalendarMonth(Number(e.target.value))} className={`px-4 py-2 rounded-xl font-bold outline-none cursor-pointer ${glassPanel} text-black dark:text-white`}>
                  {namaBulan.map((m, i) => <option key={i} value={i} className="text-black">{m}</option>)}
                </select>
                <input type="number" value={calendarYear} onChange={e => setCalendarYear(Number(e.target.value))} className={`px-4 py-2 rounded-xl font-bold outline-none w-24 ${glassPanel}`} />
              </div>
            </div>
            {/* KARTU RINGKASAN KEUNTUNGAN BERSIH (REVISI MOBILE FRIENDLY) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              <div className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 border-emerald-500`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Income</p>
                <p className="text-[13px] sm:text-2xl font-black mt-1 text-emerald-400 truncate">Rp {totalBulanRp.toLocaleString("id-ID")}</p>
              </div>
              <div className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 border-red-500`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Keluar</p>
                <p className="text-[13px] sm:text-2xl font-black mt-1 text-red-400 truncate">Rp {totalPengeluaranBulanRp.toLocaleString("id-ID")}</p>
              </div>
              <div className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-center ${glassPanel} border-t-4 sm:border-t-0 sm:border-l-4 ${labaBersih >= 0 ? 'border-blue-500 bg-blue-900/10' : 'border-yellow-500'}`}>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-70 truncate">Laba</p>
                <p className={`text-[13px] sm:text-2xl font-black mt-1 truncate ${labaBersih >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>Rp {labaBersih.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pb-4 pr-2 scroll-smooth">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                {calendarCards.map(day => (
                  <div key={day.tanggal} className={`p-4 rounded-2xl border transition-all ${day.qty > 0 ? 'bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border-indigo-500/30 shadow-lg shadow-indigo-500/10' : `${glassPanel} opacity-60 hover:opacity-100`}`}>
                    <div className="flex justify-between items-start mb-3"><span className="text-xl font-black opacity-80">{day.tanggal}</span>{day.qty > 0 && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">Aktif</span>}</div>
                    <div className="space-y-1"><p className="text-[11px] opacity-70">Transaksi: <span className="font-bold text-white text-xs">{day.qty}</span></p><p className="text-sm font-black text-emerald-400">Rp {day.total.toLocaleString("id-ID")}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeMenu === "Tracking" ? (
          <div className="max-w-7xl mx-auto h-full flex flex-col">
             <div className="mb-6"><h1 className="text-3xl font-extrabold tracking-tight">Tracking Armada 📍</h1><p className={`text-sm mt-1 ${textMuted}`}>Pantau pergerakan armada pengiriman secara real-time.</p></div>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div><h1 className="text-3xl font-extrabold tracking-tight">Database Pelanggan 👥</h1><p className={`text-sm mt-1 ${textMuted}`}>Kelola profil pelanggan untuk fitur Autofill otomatis.</p></div>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
              <div><h1 className="text-3xl font-extrabold tracking-tight">Papan Operasional</h1><p className={`text-sm mt-1 ${textMuted}`}>Kelola siklus produksi pakaian pakaian secara real-time.</p></div>
              <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 border border-white/20 transition-all active:scale-95 flex items-center gap-2">➕ <span>Pesanan Baru</span></button>
            </div>

            <div className="flex flex-col xl:flex-row justify-between mb-4 gap-4 shrink-0">
              <div className="flex gap-3 flex-wrap">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${glassPanel}`}>
                  <span className="text-sm font-bold opacity-60">📅 Filter Pembuatan:</span>
                  <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className={`text-xs md:text-sm font-bold outline-none bg-transparent cursor-pointer`} style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                  {filterTanggal && <button onClick={() => setFilterTanggal("")} className="text-red-400 hover:text-red-500 ml-1 text-xs font-bold transition-colors">✕</button>}
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={generateDanKirimLaporan} disabled={isExporting} className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${glassPanel} hover:bg-white/10`}>{isExporting ? "⏳ Ekspor..." : "📊 Unduh Excel"}</button>
                <div className={`flex p-1 rounded-xl hidden md:flex ${glassPanel}`}>
                  <button onClick={() => setViewMode("table")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "table" ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100"}`}>TABEL</button>
                  <button onClick={() => setViewMode("grid")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "grid" ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100"}`}>KANBAN</button>
                </div>
              </div>
            </div>

            {/* AREA UTAMA KANBAN BOARD */}
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
                              {item.status_pembayaran === 'Lunas' ? (
                                <span className="bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded">LUNAS</span>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded animate-pulse">{item.status_pembayaran.toUpperCase()}</span>
                                  <button onClick={(e) => { e.stopPropagation(); lunasiPesananInstant(item.id); }} className="text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md hover:bg-emerald-600 transition-all">Lunasi 💰</button>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-[11px] bg-black/20 p-2 rounded-lg mb-2 border border-white/5 text-slate-300 font-medium">
                              <span className="block text-indigo-300 font-bold mb-1">{item.paket_layanan}</span>
                              🚚 {item.metode_pengiriman || "Driver"}
                            </div>
                            
                            {/* INTEGRASI MOBILE SMART ARROW */}
                            <div className="mt-3 border-t border-white/10 pt-3">
                              {col !== "Siap Kirim" && col !== "selesai" && nextStatus ? (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] opacity-60">Operasional:</span>
                                  <button onClick={(e) => { e.stopPropagation(); perbaruiStatusPesanan(item.id, nextStatus); }} className="bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm">
                                    Lanjut ke {nextStatus} ➡️
                                  </button>
                                </div>
                              ) : col === "Siap Kirim" ? (
                                <button onClick={(e) => { e.stopPropagation(); bukaModalFoto(item.id, item.customer_name); }} className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg border border-white/20">📸 Selesaikan & Upload Bukti</button>
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

      {/* ==========================================
          MODAL DETAIL PESANAN + BARCODE TAG GENERATOR
          ========================================== */}
      {detailPesanan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4" onClick={() => setDetailPesanan(null)}>
          <div className={`rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] ${glassPanel} border-white/20 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/10 border-b border-white/10 p-5 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2">📄 Detail Pesanan <span className="bg-white/20 text-xs px-2 py-1 rounded-md">#{detailPesanan.id}</span></h2>
              <button onClick={() => setDetailPesanan(null)} className="opacity-70 hover:opacity-100 text-2xl active:scale-90">×</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* INTEGRASI BARCODE/QR TAG */}
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center">
                <h4 className="text-xs font-bold opacity-60 border-b border-white/10 pb-2 mb-3 w-full">🏷️ Label Tag Keranjang Pelacakan (Anti-Tertukar)</h4>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=LND-${detailPesanan.id}`} alt="Barcode Tag" className="w-24 h-24 object-contain bg-white p-1 rounded-xl shadow" />
                <p className="text-[11px] font-mono mt-1.5 text-indigo-300">TAG-ID: LND-{String(detailPesanan.id).padStart(4, '0')}</p>
                <button type="button" onClick={() => alert("🖨️ Mengirim sinyal cetak barcode ke Printer Thermal Bluetooth...")} className="mt-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-xs font-bold border border-white/10">🖨️ Print Label Baju</button>
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
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold opacity-60 border-b border-white/10 pb-2">Rincian Pembayaran</h4>
                <div className="flex justify-between items-center text-sm"><span className="opacity-80">Berat / Qty:</span><span className="font-bold">{detailPesanan.berat_pesanan_kg} {detailPesanan.tipe_layanan === 'satuan' ? 'Pcs' : 'KG'}</span></div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10"><span className="font-bold text-indigo-300">Total Harga:</span><span className="text-xl font-black text-emerald-400">Rp {Number(detailPesanan.total_harga || 0).toLocaleString("id-ID")}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL POS KASIR + INTEGRASI QRIS DINAMIS
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className={`rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] ${glassPanel} border-white/20 shadow-2xl`}>
            <div className="bg-white/10 border-b border-white/10 p-5 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg">🛍️ POS Kasir LaundroAI</h2>
              <button onClick={() => setIsModalOpen(false)} className="opacity-70 hover:opacity-100 text-2xl">×</button>
            </div>
            
            <form onSubmit={handleTambahPesanan} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* TIPE LAYANAN */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/20 border border-white/5">
                <button type="button" onClick={() => setFormData({...formData, tipe_layanan: "kiloan", harga_per_unit: "7000", berat_pesanan_kg: ""})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.tipe_layanan === "kiloan" ? "bg-blue-600 text-white shadow" : "opacity-60"}`}>🧺 Kiloan</button>
                <button type="button" onClick={() => setFormData({...formData, tipe_layanan: "satuan", harga_per_unit: "15000", berat_pesanan_kg: ""})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.tipe_layanan === "satuan" ? "bg-purple-600 text-white shadow" : "opacity-60"}`}>👔 Satuan</button>
              </div>

              {/* PAKET LAYANAN */}
              <div>
                <label className="block text-sm font-bold mb-1 opacity-80">Paket Layanan</label>
                <select value={formData.paket_layanan} onChange={(e) => setFormData({...formData, paket_layanan: e.target.value})} className={`w-full py-3 px-4 rounded-xl outline-none appearance-none cursor-pointer ${glassInput}`}>
                  <option value="Cuci Kering Setrika Lipat" className="text-black">Cuci Kering Setrika Lipat 👔</option>
                  <option value="Cuci Kering Lipat" className="text-black">Cuci Kering Lipat 🧺</option>
                  <option value="Cuci Kilat" className="text-black">Cuci Kilat (Express) ⚡</option>
                </select>
              </div>

              {/* METODE PENGIRIMAN */}
              <div>
                <label className="block text-sm font-bold mb-1 opacity-80">Metode Pengiriman</label>
                <select value={formData.metode_pengiriman} onChange={(e) => setFormData({...formData, metode_pengiriman: e.target.value})} className={`w-full py-3 px-4 rounded-xl outline-none appearance-none cursor-pointer ${glassInput}`}>
                  <option value="Diantar Driver Internal" className="text-black">Metode: Diantar Driver Internal 🛵</option>
                  <option value="Pickup di Toko Sendiri" className="text-black">Metode: Customer Ambil Sendiri (Pickup) 🏪</option>
                  <option value="GoSend / GrabExpress" className="text-black">Metode: GoSend / GrabExpress 📦</option>
                </select>
              </div>

              {/* CUSTOMER AUTOCOMPLETE */}
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
              
              {/* FITUR TOGGLE RINCIAN PAKAIAN (BISA UNTUK KILOAN DAN SATUAN) */}
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                  Rincian Item Pakaian <span className="text-[9px] opacity-70 normal-case">(Opsional utk Kiloan, Wajib utk Satuan)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(rincianItem).map((key) => (
                    <div key={key} className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="text-xs font-bold capitalize opacity-80 truncate">{key.replace('_', ' ')}</span>
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

              {/* INTEGRASI MANAGEMENT STATUS PIUTANG KASIR */}
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

              {/* QRIS STATIS UNIVERSAL */}
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

              {/* LOGIKA UPLOAD KAMERA DIKONDISIKAN BERDASARKAN STATUS PEMBAYARAN */}
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 font-bold py-3 rounded-xl border border-white/20 shadow-lg text-white">
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
    </div>
  );
}