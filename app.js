#!/bin/env node
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    utils = require('./my_modules/utils'),
    handlebars = require('express-handlebars').create({}),
    cookieParser = require('cookie-parser'),
    sqlite3 = require('sqlite3').verbose(),
    socketIO = require('socket.io'),
    api = require("./routes/api"),
    reg = require("./routes/reg"),
    login = require("./routes/login"),
    chat = require("./routes/chat"),
//    im = require('imagemagick'),
    session = require('express-session');


app.engine("handlebars", handlebars.engine);
app.set("view engine", 'handlebars');
app.use(cookieParser());
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(session({
    secret: "Hello World",
    resave: false,
    saveUninitialized: true,
    cookie :{
        maxAge: 1000 * 86400
    }
}));

app.use( express.static( __dirname + '/public' ) );

var server_port =  3000;
var server_ip_address = '127.0.0.1';

var server = app.listen( server_port, server_ip_address, function () {
    var host = server.address().address,
        port = server.address().port;
});

var io = socketIO(server);
currentRooms = {};
currentPrivateRoom = {};
db = new sqlite3.Database('user.db');

app.use("/api", api);
app.use("/chat", chat);
app.use("/login", login);
app.use("/reg", reg);

app.get('/', function(req, res){

    var session = req.session;

    if (req.session.isLogin){
        res.redirect("me");
    }
    else {
        res.render("login", {state: true});
    }
});

/* GET users listing. */
app.get('/init', function(req, res) {
    db.serialize(function() {
        db.run('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, username CHAR(20) NOT NULL,' +
        'password CHAR(40) NOT NULL)');
        db.run('CREATE TABLE room (room_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, room_name CHAR(20) NOT NULL)');
        db.run('CREATE TABLE record_archive (record_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, room_id INTEGER NOT NULL,'
        + 'user_id INTEGER NOT NULL, user_name CHAR(20) NOT NULL, type INTEGER NOT NULL, content TEXT, post_time DATETIME)');
        res.redirect("/");
    });
});




app.get('/me', function(req, res) {
    var session = req.session;

    if (!session.isLogin)
        res.redirect("/");
    else {
        utils.changeUserStatus(currentRooms, session.userInfo);
        res.render("me", {me : session.userInfo.username,
                            id: session.userInfo.userID});
    }
});

app.get('/logout', function(req, res) {
    req.session.isLogin = false;
    res.redirect("/");
});

app.get('/new', function(req, res, next){
    var session = req.session;
    if (!session.isLogin)
        res.redirect("/");
    else
        res.render("me", {
            me : session.userInfo.username
        });
});

app.post('/new', function(req, res){
    var me = req.session.userInfo,
        room = 0;
    if (!req.session.isLogin || !me) {
        res.redirect('/login');
        return;
    }
    room = utils.getNewRoom(currentRooms);
    me.currentRoom = room;
    me.isChatting = true;

    currentRooms[room] = {
        roomName : req.body.name,
        chatters:
            [me.username]
    };

    if (req.body.passwd) {
        currentRooms[room].isPublic = false;
        currentPrivateRoom[room] = {
            passwd : req.body.passwd
        }
    }
    else {
        currentRooms[room].isPublic = true;
    }

    res.redirect("/room/" + room);
});


app.get('/pick', function(req, res){
    var me = req.session.userInfo;

    if (!req.session.isLogin || !me) {
        res.redirect("/login");
        return;
    }
    var roomRandom = utils.getRandomRoom(currentRooms);
    me.currentRoom = roomRandom;
    me.isChatting = true;
    if (currentRooms[roomRandom].chatters.indexOf(me.username) == -1)
        currentRooms[roomRandom].chatters.push(me.username);

    res.redirect("/room/" + roomRandom);
});


/* GET users listing. */
app.all('/room/:id([0-9]+)', function(req, res) {
    var me = req.session.userInfo,
        roomId = req.params.id,
        chatters,
        pos;

    if (!req.session.isLogin || !me || !currentRooms[roomId]){
        res.redirect("/");
        return;
    }

    if (me.isChatting && roomId != me.currentRoom) {
        utils.changeUserStatus(currentRooms, me);
    }
    chatters = currentRooms[roomId].chatters.slice();
    me.isChatting = true;
    me.currentRoom = roomId;
    pos = chatters.indexOf(me.username);
    if (pos == -1) {
        currentRooms[roomId].chatters.push(me.username);
    }
    else {
        chatters.splice(pos, 1);
    }
    res.render("chat", {
        roomInfo: currentRooms[roomId],
        chatters: chatters,
        me: me
    });
});

app.use(function (req, res) {
    res.status(404);
    res.send("Not Found");
});

io.on( 'connection', function( socket ) {

    socket.on("join", function(data) {
        socket.join(data.room);
        socket.broadcast.to(data.room).emit("newClient", data.username);

    });


    socket.on("exit", function(data) {
        socket.broadcast.to(data.room).emit("exitClient", data.username);
    });

    socket.on('sendWords', function(data){
        socket.broadcast.to(data.room).emit('otherWords', data);
        db.run("INSERT INTO record_archive VALUES (NULL, ?, ?, ?, ?, ?, DATETIME('NOW', 'localtime'))",
                [data.room, data.userID, data.username, 0, data.words], function(err, row){
            if (err) throw err;
        });
    });

    socket.on('sendImage', function(data){
        socket.broadcast.to(data.room).emit('otherImage', data);
        db.run("INSERT INTO record_archive VALUES (NULL, ?, ?, ?, ?, ?, DATETIME('NOW', 'localtime'))",
            [data.room, data.userID, data.username, 1, data.imageName], function(err, row){
                if (err) throw err;
            })
    });
});
