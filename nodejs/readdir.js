var testFolder = './data';
var fs = require('fs');

fs.readdir(testFolder, function (error, filelist) {
    console.log(filelist) //node js 는 파일 목록을 배열로 만든다. 반복문을 통해서 조작할 수 있다.
})