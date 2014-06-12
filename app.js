var mysql = require('mysql')
var PHPUnserialize = require('php-unserialize');
var us = require('underscore')._
var io = require('socket.io').listen(3000)

console.log('Server listening at http://localhost:3000/')

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'test'
})
 
db.connect(function(err){
    if (err) console.log(err)
})

var usernames = []

function parseCookies(request){
        var result={};
        request.split(/;\s+/).forEach(function(e){
            var parts=e.split(/=/,2);
            result[parts[0]]=parts[1]||'';
        });
        sessionCookieName='ci_session',
        sessionId=result[sessionCookieName]||'';
        return sessionId;
    }

io.sockets.on('connection', function(socket){
    
    var rcookie = socket.handshake.headers['cookie'];
    var cookies = parseCookies(rcookie)
    var cookies = unescape(cookies)
    var session = PHPUnserialize.unserialize(cookies)

    db.query('SELECT * FROM ci_sessions WHERE session_id="' + session.session_id + '" LIMIT 1')
        .on('result', function(data) {
            var userdata = PHPUnserialize.unserialize(data.user_data)
            socket.user_id = userdata.user_id
            socket.username = userdata.username

            if(!us.contains((usernames), socket.username )) {
            var data = new Object()
            data.userid = socket.user_id
            data.username = socket.username
            usernames.push(data)

        }
        })

    socket.on('disconnect', function() {
       
        var o = us.findWhere(usernames, {'username': socket.username});  
        usernames = us.without(usernames, o);  
 
    })

})
