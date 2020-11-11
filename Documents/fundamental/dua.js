//var name; //Declare Variable





//var contoh = null;
//contoh = "Kepin";
//
//console.log(contoh);

//Var Let Const
//Let Const ES6  EcmaScripts6

//Var bisa declare dengan nama yang sama
//var name = "Kepin";
//var name = "Bambang";
//console.log(name);

//Let bisa diganti valuenya tapi tdk dideclare dgn nama yg sama(gk bisa double)
//let name = "Kepin";
//name = "Bambang";
//let name = "Susilo";
//console.log(name);

//Const tdk blh berubah
//const name = "Kepin";
//const name = "Susilo";
//console.log(name);

// var name = "Kepin mahen";
// var exp = 5;
// var coder = true;
//var str = exp.toString();

//var str = "5"; //string
//var num = 5; //number //integer
//console.log(str + num); //string+number jd 55 kalo number+number jd 10

//var str = "123";
//var num = 5;
//var boolean = false;
//var result = str + num;
//console.log(typeof str, ", Ini tipe data str");
//console.log(typeof num, ", Ini tipe data num");
//console.log(typeof result, ", Ini tipe data result");
//console.log(typeof boolean, ", Ini tipe data boolean");

//var num = 10;
//var str = "10";
//var result = parseInt(str);
////camel case
//var result = parseInt("kepin"); //akan muncul nan
////Nan = No a number

//console.log(num.toString()); //number berubah jadi string
//console.log(parseInt(str)); //string berubah jadi number
//
//console.log(num + result);

//Arithmetic
// + add
// - subtract
// * multiply
// /divide
// % modulus //nilai sisa yg dikeluarin modulus biasa dipake di algoritma
// ++Incresment
// --Decresment

var num = 10;
var str = "10";
var result = parseInt(str);

//num+=5; // +5 tiap incresment dipake saat looping
//num++; // 10 + 1
//num++; // 11+ 1
//num--; // 12 - 1
//num--; // 11 -1
//console.log(num);
//console.log(num + result);
//console.log(num - result);
//console.log(num * result);
//console.log(num % result);
//console.log(num / result);

// Math Object
//console.log(Math.PI); //phytagoras 3,14
//console.log(Math.abs(-23.34));
//console.log(Math.pow(5, 2)); //buat pangkat
//console.log(Math.sqrt(64));akar 3
//console.log(Math.cbrt(8)); akar 2
//console.log(Math.round(4.7)); //buletin keatas
//console.log(Math.floor(4.7)); //buletin kebawah
//console.log(Math.ceil(4.4));//buletin keatas
//Jdi kalo pow itu pangkat Math.pow(3,2) = 3² , Klo cbrt akar 2 , sqrt akar 3 , Math.sqrt(9) = 3 gitu


// Date Object
//var date = new Date;
//console.log(date.getFullYear());
//console.log(date.getDay());
//console.log(date.getHours());
//console.log(date.getMinutes());
//console.log(date.getSeconds());
//console.log(date.getMilliseconds());

//#1

//var x = 4;
//var y = 3;
//var z = 2;
//var w = Math.pow((x + y * z) / (x * y), z);
//console.log(w);

 

// Challenge 4
//
//var days = 485;
//var year = days / 360;
//days = days % 360;
//console.log(days);
//var months = days / 30;
//days = days % 30;
//console.log(days);
//var weeks = days / 7;
//days = days % 7;
//console.log(days);
//
//console.log(Math.floor(year), "Tahun");
//console.log(Math.floor(months), "Bulan");
//console.log(Math.floor(weeks), "minggu");
//console.log(days, "Hari");
//

