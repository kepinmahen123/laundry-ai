// condition
// boolean = true or false

// comparion operator
// Boolean
// == nilai sama walau data beda eg. num & str
// === nilai dan tipe data harus sama
// >
// <
// >=
// <=

//var x = 5;
//var y = '5'
//
//var name = 'Kepin';
//console.log(name.length <= 8);

// Logical Operator
// && and / dan
// || or / atau
// ! not / reverse logic

// Not !
//console.log(!false); hasilnya true
//console.log(!true); hasilnya false

// And &&
// dua dua harus true
// jika tidak hasilnya bakal false
// console.log(5 == '5' && 4 > 9);

// Or ||
// salah satu untuk jadi true
// console.log(!(!false || !true));

// Conditional statement
// if
// else if
// else

//var nilai = 30;
//if (nilai > 70) {
//    console.log('Bravo')
//} else if (nilai < 70 && nilai > 40) {
//    console.log('Nooo')
//} else {
//    console.log('Belajar lagi')
//}


//var pass = '123456';
//if (pass.length > 8) {
//    console.log('Strong')
//} else if (pass.length <= 8 && pass.length >= 4) {
//    console.log('Medium')
//} else {
//    console.log('Weak')
//}

//Condition tanpa boolean dan comparison
// false null undefined "" 0
// sisanya true 
//var nilai = -1;
//if (nilai) {
//    console.log("always true")
//} else {
//    console.log(false)
//}

// Switch Case
var job = "coder";
switch (job) {
    case "dokter":
        console.log("Kerja di apotek / rumah sakit / dinkes")
        break;
    case "perawat":
        console.log("Membantu pekerjaan dokter")
        break;
    case "pilot":
        console.log("Memegang kendali pesawat dan seluruh nyawa seisi pesawat")
        break;
    case "coder":
        console.log("Menulis kode yg dimengerti komputer supaya bisa diakses penggunan umum")
        break;
    case "desainer":
        console.log("Merancang, membuat, berinovasi dalam dunia kesenian ataupun teknologi")
        break;
    case "pengusaha":
        console.log("orang yg membuka lapangan pekerjaan untuk banyak orang")
        break;
    case "polisi":
        console.log("nilang pengendara")
        break;
    case "guru":
        console.log("Ngajar di sekolah")
        break;
    default:
        console.log("Gak ada dilist, capek tulisin codenya :)")
    } 
