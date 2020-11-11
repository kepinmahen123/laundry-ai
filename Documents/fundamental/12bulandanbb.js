//var date = new Date('Agu');
//var month = date.getMonth(); // 0-11
//switch (month) {
//    case 'Jan':
//        console.log("0" + " " + date)
//        break;
//    case 'Feb':
//        console.log("1" + " " + date)
//        break;
//    case 'Mar':
//        console.log("2" + " " + date)
//        break;
//    case 'Apr':
//        console.log("3" + " " + date)
//        break;
//    case 'Mei':
//        console.log("4" + " " + date)
//        break;
//    case 'Jun':
//        console.log("5" + " " + date)
//        break;
//    case 'Jul':
//        console.log("6" + " " + date)
//        break;
//    case 'Agu':
//        console.log("7" + " " + date)
//        break;
//    case 'Sep':
//        console.log("8" + " " + date)
//        break;
//    case 'Okt':
//        console.log("9" + " " + date)
//        break;
//    case 'Nov':
//        console.log("10" + " " + date)
//        break;
//    case 'Des':
//        console.log("11" + " " + date)
//        break;
//}

var kg = 74;
var m = 170;

var x = Math.pow(m,2);
var ima = kg / x;

console.log(ima);

if (ima < 18.5) {
    console.log("Berat badan kurang")
} else if (ima >= 18.5 && ima <= 24.9) {
    console.log("Berat badan ideal")
} else if (ima >=25.0 && ima <=29.9) {
    console.log("BB berlebih")
} else if (ima >= 30.0 && ima <= 39.9) {
    console.log("BB sangat berlebih")
} else {
    console.log("Obesitas")
}




