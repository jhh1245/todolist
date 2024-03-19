const express = require('express') //모듈을 가져와서 express라는 이름을 붙임(상수, 앞으로 이름이 바뀌지 않는다)
const app = express() //express는 함수고, 리턴된 값을 app에 담는다
const port = 3100
const template = require('./lib/template.js'); //내가 만든 모듈 
const path = require('path'); // URL에서 ../ 이렇게 들어오면 내 컴퓨터 파일 볼 수 있는 문제 -> 보안을 위해서 모듈 추가
const bodyParser = require('body-parser');
const mysql = require('mysql');
const db = mysql.createConnection({ //커넥션을 생성 
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'opentutorials'
});
db.connect(); // 실제 접속이 일어나는 부분 

const session = require('express-session') //로그인 

app.use(express.static(path.join(__dirname, 'css'))) //css 적용 

app.use(bodyParser.urlencoded({ extended: false }));
// bodyParser가 실행되면서 그 결과로 미들웨어가 들어오게됨 bodyParser.urlencoded({extended: false}) 부분에 
// main.js 실행될때 마다, 사용자가 요청할때 마다 위 코드로 인해 만들어진 미들웨어가 실행됨 
//내부적으로 사용자가 전달한 post 데이터를 분석해서 create_process 콜백을 호출하도록 약속됨 
// app.post('/create_process', function (request, response) { --> 여기에서 request 변수에 body 프로퍼티를 만들어줌 (body parser가)

app.use(session({ secret: 'jhh1245', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }))
//secret은 해시 문자열. 나만 알 수 있는 고유한 문자열 입력 

app.use((req, res, next) => { //여기 아래변수들은 모든 페이지에서 공유될 수 있게함 
    res.locals.user_id = "";
    res.locals.name = "";

    if (req.session.member) { //session.member 값이 있으면 = 로그인했으면 
        res.locals.user_id = req.session.member.user_id; //세션에 넣은 값을 locals에 저장 
        res.locals.name = req.session.member.name;
    }
    next();
})



app.get('/', (request, response) => { //경로, 접속자가 들어왔을 때 호출될 함수 
    db.query(`SELECT * FROM topic where state=0`, function (error, topics) { //에러일 경우 에러 정보를, 정상동작했을 땐 sql결과가 담김
        db.query(`SELECT * FROM topic where state=1`, function (error, complete_topics) { //완료한 목록
            //console.log(topics);

            const title = 'Home';
            //const description = 'Todo list made by jh';
            const list = template.list(topics);
            const complete_list = template.complete_list(complete_topics);
            const html = template.HTML(title, list,
                `<h2>${title}</h2>`,
                `<a href="/create" class="custom-btn btn-4">create</a>
            <a href="/login" class="custom-btn btn-4">login</a>`, complete_list
            );
            response.writeHead(200);
            response.end(html);
        });
    });
})

app.get('/page/:pageId', function (request, response) { //* URL 패스방식으로 파라미터 처리하는 라우팅 기법 살펴봄
    const filteredId = path.parse(request.params.pageId).base // *쿼리스트링을 사용하지 않으니 변경
    //글 목록 가져옴 
    db.query(`SELECT * FROM topic where state=0`, function (error, topics) {
        if (error) {
            throw error;
        }
        db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id=author.id WHERE topic.id=?`, [filteredId], function (error2, topic) {
            if (error2) {
                throw error2;
            }
            //console.log(topic);

            const title = topic[0].title;
            const description = topic[0].description;
            //const list = template.list(topics);
            const list = '';
            const html = template.HTML(title, list,
                `<h2>${title}</h2>
                ${description}
                <p>by ${topic[0].name}</p>`,
                `<a href="/create">create</a>
                <a href="/update/${filteredId}">update</a>
                <form action="/complete_process" method="post"> 
                        <input type="hidden" name="id" value="${filteredId}">
                        <input type="submit" value="complete">
                    </form>
                    <form action="/delete_process" method="post"> 
                        <input type="hidden" name="id" value="${filteredId}">
                        <input type="submit" value="delete">
                    </form>`
            );
            response.writeHead(200);
            response.end(html);
        });
    });
});

app.get('/create', function (request, response) { //* URL 패스방식으로 파라미터 처리하는 라우팅 기법 살펴봄

    db.query(`SELECT * FROM topic where state=0`, function (error, topics) {
        db.query(`SELECT * FROM author`, function (error2, authors) {
            const title = 'Create';
            const list = template.list(topics);
            const html = template.HTML(title, list,
                `
              <form action="/create_process" method="post">
                <p><input type="text" name="title" placeholder="할일을 적어주세요."></p>
                <p>
                  <textarea name="description" placeholder="상세 내용"></textarea>
                </p>
                <p>
                    ${template.authorSelect(authors)}
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
              `,
                `<a href="/create">create</a>`
            );
            response.writeHead(200);
            response.end(html);
        })

    });
});

app.post('/create_process', function (request, response) { //* post방식이니까 앞에 app.post

    const post = request.body;
    const title = post.title;
    const description = post.description;

    db.query(`
            INSERT INTO topic (title, description, created, author_id, state) 
              VALUES(?, ?, NOW(), ?, 0)`,
        [post.title, post.description, post.author],
        function (error, result) {
            if (error) {
                throw error;
            }
            response.writeHead(302, { Location: `/?id=${result.insertId}` });
            response.end();
        }
    )
});


app.get('/update/:pageId', function (request, response) { // ** 위에 /page/:pageId에서 링크를 만들어줄 때 id를 넣어줬으니까 여기도 update/:pageid

    const filteredId = path.parse(request.params.pageId).base
    db.query('SELECT * FROM topic where state=0', function (error, topics) {
        if (error) {
            throw error;
        }

        console.log("이건 topics !!  로그 ===================");
        console.log(topics);
        db.query(`SELECT * FROM topic WHERE id=?`, [filteredId], function (error2, topic) {
            if (error2) {
                throw error2;
            }
            console.log("이건 topic 로그 ===================");
            console.log(topic);
            db.query(`SELECT * FROM author`, function (error2, authors) {
                const list = template.list(topics);
                const html = template.HTML(topic[0].title, list,
                    `
                    <form action="/update_process" method="post">
                    <input type="hidden" name="id" value="${topic[0].id}">
                    <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
                    <p>
                        <textarea name="description" placeholder="description">${topic[0].description}</textarea>
                    </p>
                    <p>
                        ${template.authorSelect(authors, topic[0].author_id)}
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                    </form>
                    `,
                    `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`
                );
                console.log("title ================= " + topic[0].title)
                response.writeHead(200);
                response.end(html);
            });

        });
    });
});

app.post('/update_process', function (request, response) {
    const post = request.body;
    const id = post.id; //id값을 추가. 어떤 게시글을 수정할건지 알아야 해서
    const title = post.title;
    const description = post.description;


    db.query('UPDATE topic SET title=?, description=?, author_id=? WHERE id=?', [post.title, post.description, post.author, post.id], function (error, result) {
        response.writeHead(302, { Location: `/page/${post.id}` });
        response.end();
    })
    console.log(post);
});

// app.post('/delete_process', function (request, response) {
//     const post = request.body;
//     const id = post.id;
//     const filteredId = path.parse(id).base


//     db.query('DELETE FROM topic WHERE id = ?', [post.id], function (error, result) {
//         if (error) {
//             throw error;
//         }
//         //response.send("<script>input = confirm('삭제할거니?.'); if(input){ alert('ddd');}location.href='/'</script>");

//         response.redirect('/');
//     });
// });


app.post('/delete_process', function (request, response) {
    const post = request.body;
    const id = post.id; //id값을 추가. 어떤 게시글을 수정할건지 알아야 해서
    const filteredId = path.parse(id).base;

    // Sending a confirmation message to the client-side
    response.send("<script>const input = confirm('삭제하시겠습니까?'); if(input){ window.location.href='/delete_confirm?id=" + id + "'; } else { window.location.href='/'; }</script>");
});

// Endpoint to handle delete confirmation
app.get('/delete_confirm', function (request, response) {
    const id = request.query.id;

    db.query('DELETE FROM topic WHERE id = ?', [id], function (error, result) {
        if (error) {
            throw error;
        }
        response.redirect('/');
    });
});


//로그인기능 추가중 24.03.10 
app.get('/login', function (request, response) {
    db.query(`SELECT * FROM topic where state=0`, function (error, topics) {
        if (error) {
            throw error;
        }
        const title = 'Login';
        const list = template.list(topics);
        const html = template.HTML(title, list,
            `
              <form action="/login_process" method="post">
                <ul>
                <li> 로그인 </li>
                <li> 아이디 <input type="text" name="user_id" required></li>
                <li> 비밀번호 <input type="password" name="pw" required></li>
                <button>로그인</button>
                </ul>
              </form>`
            ,
            `<a href="/create">create</a>`
        );
        response.writeHead(200);
        response.end(html);
    });
});



app.post('/login_process', function (request, response) {
    const post = request.body;
    const user_id = post.user_id;
    const pw = post.pw;

    console.log(post);
    db.query('select * from member where user_id=? and pw=?', [post.user_id, post.pw], function (error, result) { //DB에서 해당 계정 찾음
        if (result.length == 0) { //길이가 0이라는 의미는 위 쿼리 결과값이 없다 = 해당 계정이 없다. 
            response.send("<script> alert('존재하지 않는 아이디입니다.'); location.href='/'</script>");
        } else {
            console.log(result[0]);
            request.session.member = request[0]; //세션에 저장 
            response.send("<script> alert('로그인 되었습니다.'); location.href='/'</script>");
        }
        //response.writeHead(302);
        response.end();

    })

});

app.get('/logout', (request, response) => {
    request.session.member = null;
    response.send("<script>alert('로그아웃되었습니다'); location.href='/';</script>");
    console.log(request.session.member)
})


// 24.03.17 todolist 완료버튼 구현 
app.post('/complete_process', function (request, response) {
    const post = request.body;
    const id = post.id; //id값을 추가. 어떤 게시글을 완료 할건지 알아야 해서
    //const title = post.title;
    //const description = post.description;
    console.log(post);

    db.query('UPDATE topic SET state=? WHERE id=?', [1, post.id], function (error, result) {
        if (error) {
            throw error;
        }
        response.redirect('/');
    })
});

app.post('/cancel_complete_process', function (request, response) { //완료 목록을 다시 활성화 시킬 때 
    const post = request.body;
    const id = post.id; //id값을 추가. 어떤 게시글을 완료 할건지 알아야 해서
    //const title = post.title;
    //const description = post.description;
    console.log(post);

    db.query('UPDATE topic SET state=? WHERE id=?', [0, post.id], function (error, result) {
        if (error) {
            throw error;
        }

        response.redirect('/');
    })
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
