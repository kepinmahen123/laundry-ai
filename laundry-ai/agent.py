import os
import requests
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI 

# 1. MASUKKAN API KEY GEMINI KAMU DI SINI (Biarkan tanda kutipnya tetap ada)
os.environ["GOOGLE_API_KEY"] = "KODE_RAHASIAL_DISEMBUNYIKAN_SEMENTARA"

# 2. Cetak Biru Data
class EkstraksiPesanan(BaseModel):
    customer_name: str = Field(description="Nama pelanggan. Jika tidak disebut, isi dengan 'Pelanggan Toko'")
    alamat: str = Field(description="Alamat lengkap lokasi penjemputan atau pengantaran")
    jarak_km: float = Field(description="Angka jarak dalam KM. Jika tidak disebut, isi dengan angka 2.0")
    berat_kg: float = Field(description="Berat total cucian dalam angka desimal (KG)")
    driver_id: int = Field(default=1, description="ID driver internal, default diisi 1")

# 3. Inisialisasi Otak AI
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0)
ai_terstruktur = llm.with_structured_output(EkstraksiPesanan)

def proses_chat_pelanggan(pesan_chat: str):
    print("\n[AI] Sedang membaca dan memahami chat pelanggan...")
    
    # AI mengekstrak data
    data_hasil_ekstraksi = ai_terstruktur.invoke(pesan_chat)
    print(f"[AI] Berhasil mengekstrak data: {data_hasil_ekstraksi.model_dump()}")
    
    # Kirim ke API FastAPI lokal
    url_api_fastapi = "http://127.0.0.1:8000/api/v1/orders"
    print("[Sistem] Mengirim data hasil AI ke FastAPI & Supabase...")
    
    respon = requests.post(url_api_fastapi, json=data_hasil_ekstraksi.model_dump())
    return respon.json()

# ==========================================
# UJI COBA OTOMATIS JALAN
# ==========================================
if __name__ == "__main__":
    chat_masuk = "Halo admin, saya Kevin Mahendra. Mau laundry bedcover seberat 8.5kg dong, tolong suruh kurir jemput ke Apartemen Puri Indah ya. Jarak dari toko deket kok cuma 3.5km."
    
    hasil = proses_chat_pelanggan(chat_masuk)
    print(f"\n[Server Response] {hasil}")