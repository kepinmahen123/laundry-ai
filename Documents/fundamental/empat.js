// var angka = 0; // 1 // 2
// while (true) {
//     console.log(angka);
//     angka++;
// }

// var angka = 0;
// var loop = true;

// while (loop) {
//     console.log(angka, 'while aja');
//     angka++;
//     // if (angka === 5) {
//     //     loop = false;
//     // }
// }

// do {
//     //cek kondisi setelah jalan sekali
//     //eg. mesin atm
//     console.log('Hello', 'do while');
//     angka++;
//     // kondisi dibawah
// } while (false);

// var angka;

// for (angka = 1; angka <= 100; angka++) {
//     if (angka % 2 === 0) {
//         console.log('genap', '\t', angka);
//     } else {
//         console.log('ganjil', '\t', angka);
//     }
// }

// // Baris HORIZONTAL
// var output = "";
// for (var i = 0; i < 5; i++) {
//     output += "*";
// }

// // Baris VERTIKAL
// for (var i = 0; i < 5; i++) {
//     output += "* \n";
// }
// console.log(output);

// Square
// var output = "";
// for (var j = 0; j < 10; j--) { //susun kebawah 

// for (var i = 0; i < 10; i--) { //susun kesamping kanan
//     output += "*" + " ";
//     }
//     output += "\n";
// }
// console.log(output);

var output = "";
for (var i = 1; i < 5; i++) {
    for (var j = 5; i < j; j--) {
        output += "*";
    }
    output += "\n";
}
console.log(output);