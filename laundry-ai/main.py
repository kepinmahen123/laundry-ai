# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
# Mengimpor fungsi proses dari file yang kita buat di langkah sebelumnya
from logistik_supabase import proses_pesanan_masuk 

app = FastAPI(title="Sistem Logistik Laundry API")

# 1. Definisikan Struktur Data Input (Skema Request)
class PesananBaruRequest(BaseModel):
    customer_name: str
    alamat: str
    jarak_km: float
    berat_kg: float
    driver_id: int

# 2. Endpoint Utama untuk Menerima Pesanan Baru
@app.post("/api/v1/orders")
def buat_pesanan_logistik(request: PesananBaruRequest):
    try:
        # Jalankan fungsi validasi dan simpan ke Supabase
        hasil = proses_pesanan_masuk(
            customer_name=request.customer_name,
            alamat=request.alamat,
            jarak_km=request.jarak_km,
            berat_kg=request.berat_kg,
            driver_id=request.driver_id
        )
        
        # Jika validasi gagal karena melanggar aturan (jarak/berat/titik)
        if hasil["status"] == "GAGAL" or hasil["status"] == "DITOLAK":
            raise HTTPException(status_code=400, detail=hasil["alasan"])
            
        return hasil

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Endpoint Sederhana untuk Cek Status Server
@app.get("/")
def index():
    return {"status": "Server Logistik Berjalan Lancar"}