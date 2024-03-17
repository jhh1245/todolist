/////// mysql 연동 ////////

const mysql = require('mysql2'); //mysql 모듈 사용을 mysql변수 통해서 사용함
const connection = mysql.createConnection({ //mysql변수안 메서드 사용, 
    host: 'localhost', // node.js가 mysql서버 접속하려면 정보 전달 필요
    user: 'root',
    password: 'root',
    database: 'opentutorials'
});

connection.connect();

connection.query('SELECT * FROM topic', (error, rows, fields) => {
    if (error) {
        console.log(error); //error안 값이 있다.
    }
    console.log(rows);
});

connection.end();
//////////////////////////