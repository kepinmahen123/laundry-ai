// Array
//Element adalah satu data di dalam array
// Setiap element punya index masing"
// Index adalah urutan element di dalam array
// Index dihitung dari 0
// var nama = "Kepin";
// var namaStorage = ["kepin", "mahen", "bambang",
//                 "kepin", "mahen", "bambang",
//                 "kepin", "mahen", "bambang",
//                 "kepin", "mahen", "bambang"];
//console.log(namaStorage.toString());
//console.log(namaStorage.join(" * "));
//console.log(namaStorage[3]);
//console.log(namaStorage[2].length);
//console.log(namaStorage.length);
// console.log(panjangArr);

//namaStorage.pop(); //ilangin element paling terakhir
//nameStorage.push("kaka"); //nambahin isi "kaka" di element trakhir

//Shift -> ilangin element dalam array paling depan
//namaStorage.shift("kaka")

// Unshift -> nambahin element baru ke dalam array di ururtan pertama
//namaStorage.unshift();

// Splice
//namaStorage.splice(0, 2); //mulai dari index pertama hilangin 2 element
//namaStorage.splice(1, 2, "Mawar", "Melati"); 
//console.log(namaStorage);

// var nama = "Kepin"
// var namaStorage = [
//     nama,
//     "Bambang",
//     "Susilo",
//     nama,
//     "Bambang",
//     "Susilo",
//     nama,
//     "Bambang",
//     "Susilo",
//     nama,
//     "Bambang",
//     "Susilo",
// ];
// Splice
// namaStorage.splice (1, 2);
// namaStorage.splice(1, 1);
// namaStorage.splice(3, 1);
// namaStorage.splice(5, 1);
// namaStorage.splice(7,1);

// for (var i = 1; i <= namaStorage; i += 2); {
//     namaStorage.splice(i, 1);
// }
// console.log(namaStorage);

// Slice
// Ambil sebagian dari Array
// Mulai dari angka pertama sampai angka kedua (Element di angka kedua tidak ikut diambil)
// var namaStorage = [
//     "Lian", 
//     "Bambang", 
//     "Susilo", 
//     "Kepin", 
//     "Mahen", 
//     "Kapal"
// ];
// //console.log(namaStorage.slice(2));
// console.log(namaStorage.slice(2, 5));

var buah = ["Apel", "Pisang", "Nangka"];
// Adding New Element
// Push
// Unshift
// Manual
// buah.push("Duren"); // Tambah dibelakang
// buah.unshift("Kedondong"); // Tambah di paling depan
// buah[5] = "Kiwi";
// buah[6] = "Rambutan";
// buah[7] = "Mangga";

// 83 dan 84 pny tujuan yg sama
// buah[3] = "Pisang"; 
// buah[buah.length] = "Pisang"; // Lebih dinamis
// console.log(buah);

var buah1 = ["Apel", "Pisang", "Nangka"];
var buah2 = ["Alpukat", "Salak", "Jeruk"];

