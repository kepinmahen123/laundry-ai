import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hubungkan ke Supabase milikmu
const supabaseUrl = "https://siutldehyyiaaibdxexg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdXRsZGVoeXlpYWFpYmR4ZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTQ0MTYsImV4cCI6MjA5NTU3MDQxNn0.u1lpRzvierjPsDxRPI4-RwaWZ2z3WPp2cjoZe7P3QAk";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // 1. Baca pesan yang dikirim oleh Telegram
    const body = await request.json();
    const pesanMasuk = body.message?.text || "";
    const chatId = body.message?.chat?.id;

    // 2. Cek apakah pesan diawali dengan format "/order"
    // Contoh format ketikan kurir di Telegram: 
    // /order Kevin, Jl. Anggrek No 5, 2.5, 1, -6.2088, 106.8456
    if (pesanMasuk.startsWith("/order")) {
      
      // Bersihkan kata "/order" dan pisahkan data berdasarkan tanda koma
      const dataString = pesanMasuk.replace("/order ", "");
      const dataArray = dataString.split(",");

      if (dataArray.length >= 6) {
        const customer_name = dataArray[0].trim();
        const alamat_detail = dataArray[1].trim();
        const jarak_ke_toko_km = Number(dataArray[2].trim());
        const berat_pesanan_kg = Number(dataArray[3].trim());
        const latitude = Number(dataArray[4].trim());
        const longitude = Number(dataArray[5].trim());

        // 3. Masukkan data ke Database Supabase
        const { error } = await supabase.from("orders").insert([
          { 
            customer_name, alamat_detail, jarak_ke_toko_km, berat_pesanan_kg, 
            latitude, longitude, status_logistik: "pickup" 
          }
        ]);

        if (error) throw error;

        // 4. Balas pesan Telegram kalau sukses
        await fetch(`https://api.telegram.org/bot8677964593:AAET5YSSs216dA8sWtSJKLWWJED03v4qGVc/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Pesanan untuk ${customer_name} berhasil dimasukkan ke Dashboard!`
          })
        });
      }
    }

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "Error" }, { status: 500 });
  }
}