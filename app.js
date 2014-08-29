var express = require('express')
var app = express()
var server = require('http').Server(app)
var mysql = require('mysql')
var PHPUnserialize = require('php-unserialize')
var us = require('underscore')._
var io = require('socket.io')(server)

var db = mysql.createConnection({
host: 'localhost',
user: 'root',
database: 'test'
})

db.connect(function(err){
if (err) console.log(err)
})

server.listen(3000, function(){
	console.log('Server listening on *:3000')	
})

app.use(express.static(__dirname+'/public'))
 
var usernames = []

io.sockets.on('connection', function(socket){
connect(socket)

socket.on('disconnect', function() {
disconnect(socket)
})

})

function parseCookies(request){
var result={}
request.split(/;\s+/).forEach(function(e){
var parts=e.split(/=/,2)
result[parts[0]]=parts[1]||''
})
sessionCookieName='ci_session',
sessionId=result[sessionCookieName]||''
return sessionId
 }

function connect(socket){

var rcookie = socket.handshake.headers['cookie']
var cookies = parseCookies(rcookie)
var cookies = unescape(cookies)

if(cookies) {
var session = PHPUnserialize.unserialize(cookies)

if(session.session_id && session.ip_address) {
db.query('SELECT * FROM ci_sessions WHERE session_id="' + session.session_id + '" AND ip_address="' + session.ip_address + '" LIMIT 1', function(err, result){

if (err) throw err

var data = result[0]
if(data && data.user_data) {
var userdata = PHPUnserialize.unserialize(data.user_data)
socket.user_id = userdata.user_id
socket.username = userdata.username
socket.avatar = userdata.avatar

var data = new Object()
data.sid = socket.id
data.userid = socket.user_id
data.username = socket.username
data.avatar = socket.avatar
usernames.push(data)
usernames = us.uniq(usernames)

} else {
socket.emit('alert message', 'No valid CI session!')
console.log('*** NO VALID CI SESSION! *** [' + session.session_id + ']')
}
})
}
}
}

function disconnect(socket) {
var o = us.findWhere(usernames, {'username': socket.username}) 
usernames = us.without(usernames, o)
}