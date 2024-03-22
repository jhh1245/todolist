module.exports = { //refactoring : 각각 함수였던 걸 -> template라는 객체로 묶음 
    HTML: function (title, list, body, control, complete_list) { //함수 이름은 필요없어서 지움, 여기서 html은 프로퍼티라고 부름
        //재사용할 수 있는 껍데기라는 의미 = 템플릿 
        return `
        <!doctype html>
            <html>
                <head>
                    <title>Todo List  - ${title}</title>
                    <meta charset="utf-8">
                    <link rel="stylesheet" href="/main.css">
                </head>
                <body>
                <div class="container">
                    <h1><a href="/">Todo List </a></h1>
                    ${control}
                    ${list}
                    ${body}  
                    
                    <h2>완료목록</h2>
                    ${complete_list}
                    </div>
                </body>
            </html>
        `;
    }, list: function (topics) {
        var list = '<ul>';
        var i = 0;
        while (i < topics.length) { //아래에 원래는 ?id=를 /page/로 수정 (쿼리스트링안쓰기 위해)
            list = list + `<li>
                <a href="/page/${topics[i].id}">${topics[i].title}</a>
                <a href="/update/${topics[i].id}" class="custom-btn btn-4">update</a>
                
                <form action="/complete_process" style="display:inline" method="post"> 
                    <input type="hidden" name="id" value="${topics[i].id}">
                    <input type="submit" class="custom-btn btn-4" value="complete">
                </form>
                <form action="/delete_process" style="display:inline" method="post"> 
                    <input type="hidden" name="id" value="${topics[i].id}">
                    <input type="submit" class="custom-btn btn-4" value="delete">
                </form></li>
                    `
                ;
            i = i + 1;
        }
        // <li><a href="?id=HTML">HTML</a></li>
        // <li><a href="?id=CSS">CSS</a></li>
        // <li><a href="?id=JavaScript">JavaScript</a></li>

        list = list + '</ul>';

        return list;
    }, authorSelect: function (authors, author_id) {
        var tag = '';
        var i = 0;
        while (i < authors.length) {
            var selected = '';
            if (authors[i].id === author_id) {
                selected = ' selected';
            }
            tag += `<option value="${authors[i].id}"${selected}>${authors[i].name}</option>`;
            i++;
        }
        return `
        <select name="author">
            ${tag}
        </select>`
    }, complete_list: function (topics) { //완료한 목록 
        var list = '<ul>';
        var i = 0;
        while (i < topics.length) { //아래에 원래는 ?id=를 /page/로 수정 (쿼리스트링안쓰기 위해)
            list = list + `<li><a href="/page/${topics[i].id}">${topics[i].title}</a>
            <form action="/cancel_complete_process" style="display:inline" method="post"> 
                <input type="hidden" name="id" value="${topics[i].id}">
                <input class="custom-btn btn-4" type="submit" value="active">
            </form>
            
            
            </li>`;
            i = i + 1;
        }
        // <li><a href="?id=HTML">HTML</a></li>
        // <li><a href="?id=CSS">CSS</a></li>
        // <li><a href="?id=JavaScript">JavaScript</a></li>

        list = list + '</ul>';

        return list;
    }
}

//module.exports = template;