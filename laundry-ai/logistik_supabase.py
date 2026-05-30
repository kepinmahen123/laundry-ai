import os
from supabase import create_client, Client

# 1. Inisialisasi Koneksi Supabase
# Di dunia nyata, gunakan environment variables (os.environ.get) untuk keamanan
SUPABASE_URL = "https://siutldehyyiaaibdxexg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdXRsZGVoeXlpYWFpYmR4ZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTQ0MTYsImV4cCI6MjA5NTU3MDQxNn0.u1lpRzvierjPsDxRPI4-RwaWZ2z3WPp2cjoZe7P3QAk"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def ambil_atau_buat_trip_hari_ini(driver_id: int) -> dict:
    """
    Mengambil data perjalanan driver hari ini dari database.
    Jika driver belum punya trip hari ini, sistem otomatis membuat baris baru.
    """
    from datetime import date
    hari_ini = str(date.today())
    
    # Cek apakah sudah ada trip untuk driver ini hari ini
    respon = supabase.table("driver_trips").select("*").eq("driver_id", driver_id).eq("tanggal", hari_ini).execute()
    
    if len(respon.data) > 0:
        return respon.data[0]
    else:
        # Jika belum ada, buat trip baru dengan nilai awal 0
        data_baru = {
            "driver_id": driver_id,
            "tanggal": hari_ini,
            "total_berat_kg": 0.0,
            "total_titik": 0
        }
        insert_respon = supabase.table("driver_trips").insert(data_baru).execute()
        return insert_respon.data[0]

def proses_pesanan_masuk(customer_name: str, alamat: str, jarak_km: float, berat_kg: float, driver_id: int):
    """
    Fungsi utama yang mengintegrasikan database dan logika validasi logistik.
    """
    # 1. Ambil kondisi kurir saat ini dari database
    trip = ambil_atau_buat_trip_hari_ini(driver_id)
    
    # 2. Aturan Validasi Keras (Hard Constraints)
    if jarak_km > 5.0:
        return {"status": "DITOLAK", "alasan": f"Jarak {jarak_km}km melebihi radius maksimal 5km."}
        
    simulasi_berat = float(trip["total_berat_kg"]) + berat_kg
    simulasi_titik = trip["total_titik"] + 1
    
    if simulasi_berat > 40.0:
        return {"status": "GAGAL", "alasan": f"Berat total akan menjadi {simulasi_berat}kg (Maksimal 40kg)."}
        
    if simulasi_titik > 5:
        return {"status": "GAGAL", "alasan": "Jumlah titik pengantaran sudah penuh (Maksimal 5 titik)."}
        
    # 3. Jika Lolos Validasi, Update Database (Simpan Pesanan & Update Trip)
    # Update tabel driver_trips
    supabase.table("driver_trips").update({
        "total_berat_kg": simulasi_berat,
        "total_titik": simulasi_titik
    }).eq("id", trip["id"]).execute()
    
    # Masukkan data ke tabel orders
    pesanan_baru = {
        "customer_name": customer_name,
        "alamat_detail": alamat,
        "jarak_ke_toko_km": jarak_km,
        "berat_pesanan_kg": berat_kg,
        "trip_id": trip["id"],
        "status_logistik": "pickup"
    }
    supabase.table("orders").insert(pesanan_baru).execute()
    
    return {
        "status": "SUKSES",
        "alasan": "Pesanan berhasil dicatat dan kurir dijadwalkan.",
        "trip_sekarang": {"total_berat_kg": simulasi_berat, "total_titik": simulasi_titik}
    }

# ==========================================
# CONTOH MENJALANKAN FUNGSI
# ==========================================
if __name__ == "__main__":
    # Contoh: Ada pesanan masuk dari Budi, berat 5kg, jarak 3km, ditugaskan ke Driver ID: 1
    # Hasil = proses_pesanan_masuk("Budi", "Jl. Puri Indah No. 12", 3.0, 5.0, driver_id=1)
    # print(Hasil)
    pass
