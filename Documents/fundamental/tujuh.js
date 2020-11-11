// Object
// Property dan Value
// Porperty === nama dari index
// value === nilai yg disimpan

// Method === sebuah function di dalam object
// var bioData = {
//     nama : "Kepin", 
//     namaBlkng : "mahendra", 
//     umur : "18" ,
//     noTelp : "087771775321",
//     laptop : {
//         manufacturer : "Asus",
//         type : "Zenbook",
//         ram : ["8gb", "16gb"],
//     },
//     namaFull : function (){
//         return this.nama + " " + this.namaBlkng;
//     },
// };
// bioData.alamat = ["BSD", "Bandung"];
// console.log(bioData.namaFull());
// console.log(bioData.nama);
// console.log(bioData.laptop.ram[0]);

// var toko = {
//     barisanBuah: ["Apel", "Nangka", 
//     [
//         { nama : "monthong", harga : 4000 },
//         { nama : "musanking", harga : 500000 },
//     ],
//     ],
//     barisanDaging: ["ayam", "sapi", "kambing"],
//     barisanSnack: ["cheetos", "lays", "chitato"],

// };
// console.log(toko.barisanBuah[2][1].harga);

// var john = new Object();
// john.name = "John";
// console.log(john);

// Class === cetakan object

class bioData {
    constructor(nama, usia, pekerjaan) {
        this.name = nama;
        this.usia = usia;
        this.pekerjaan = pekerjaan;
    }
}

var john = new bioData("John", 50, "Hunter");
var lebron = new bioData("James", 32, "NBA")
console.log(john);
console.log(lebron);