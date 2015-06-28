#!/bin/env node
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    utils = require('./my_modules/utils'),
    handlebars = require('express-handlebars').create({}),
    cookieParser = require('cookie-parser'),
    sqlite3 = require('sqlite3').verbose(),
    db = new sqlite3.Database('user.db'),
    md5 = require('MD5'),
    socketIO = require('socket.io'),
    api = require("./routes/api"),
    fs = require("fs");


app.engine("handlebars", handlebars.engine);
app.set("view engine", 'handlebars');
app.use(cookieParser());
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use( express.static( __dirname + '/public' ) );

var server_port =  3000;
var server_ip_address = '127.0.0.1';

var server = app.listen( server_port, server_ip_address, function () {
    var host = server.address().address,
        port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)

});

var io = socketIO(server);
currentRooms = {};
onlineUsers = {};

app.use("/api", api);

app.get('/', function(req, res){

    var i = 0,
         id = req.cookies.id;
    if (id){
        if (id in onlineUsers) {
            res.cookie("id", id, {maxAge: 1000 * 86400});
            res.redirect("me");
        }
        else {
            db.all("SELECT * FROM user WHERE cookie = ?", [id], function(err, rows) {
                if (err) throw err;
                if (rows.length > 0){
                    onlineUsers[id] = {
                        username : rows[0].username,
                        isChatting: false,
                        currentRoom : -1
                    };
                    res.redirect("me");
                }
                else {
                    res.cookie("id", "",{maxAge: -10000});
                    res.render("login", {state: true});
                }
            });
        }
    }
    else {
        res.render("login", {state: true});
    }
});

app.get("/login", function(req, res){
    res.redirect("/");
});

app.post('/login', function (req, res) {
    var pwdhash,
        cookie,
        sql = "",
        inserts = [];
    if (req.body.username && req.body.password) {
        pwdhash = md5(req.body.username + req.body.password);
        sql = "SELECT * FROM user WHERE password = ?";
        inserts = [pwdhash];
        //console.log(sql);
        db.all(sql, inserts, function(err, rows) {
            if (err) throw err;
            if (rows.length > 0) {
                cookie = md5(Math.random() + "");
                sql = "UPDATE user SET cookie = ? WHERE password = ?";
                inserts = [cookie, pwdhash];
                onlineUsers[cookie] = {
                    username : rows[0].username,
                    isChatting: false,
                    currentRoom : -1
                };
                db.run(sql, inserts, function(){
                    res.cookie("id", cookie, {maxAge: 1000 * 86400});
                    res.redirect("me");
                });
            }
            else {
                res.render("login", {state: false});
            }
        });
    }
    else {
        res.render("login", {state: false});
    }
});

app.get('/nameValidate', function(req, res) {
    console.log(req.query.name);
    db.all('SELECT * FROM user WHERE username = ?', [req.query.name], function(err, rows) {
        if (err) throw err;

        if (rows.length == 0)
            res.json({isValid : true});
        else
            res.json({isValid : false});
    });
});

/* GET users listing. */
app.get('/init', function(req, res) {
    db.serialize(function() {
        db.run('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, username CHAR(20) NOT NULL,' +
        'password CHAR(40) NOT NULL, cookie CHAR(40), score INTEGER)', function(){});
        db.run('CREATE TABLE room (room_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, room_name CHAR(20) NOT NULL)', function(){});
        db.run('CREATE TABLE record_archive (record_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, room_id INTEGER NOT NULL,'
        + 'id INTEGER NOT NULL, post_time DATETIME)', function(){});
        res.redirect("/");
    });
});


app.post('/reg', function(req, res){
    var pwdhash,
        cookie,
        sql = "",
        inserts = [],
        username = req.body.username,
        password = req.body.password;
    console.log(req.body);
    if (username && password) {
        pwdhash = md5(username + password);
        cookie = md5(Math.random() + "");
        sql = "INSERT INTO user VALUES (NULL, ?, ?, ?, 0)";
        inserts = [username, pwdhash, cookie];
        db.run(sql, inserts, function(err, rows) {
            if (err) throw err;
            onlineUsers[cookie] = {
                username : username,
                isChatting: false,
                currentRoom : -1
            };
            res.cookie("id", cookie, {maxAge: 1000 * 86400});
            res.redirect("me");
        });
    }
    else {
        res.redirect('/reg.html');
    }
});

app.get('/me', function(req, res) {
    var id = req.cookies.id;
    console.log(onlineUsers);

    if (!onlineUsers[id])
        res.redirect("/");
    else {
        utils.changeUserStatus(onlineUsers, currentRooms, id);
        res.render("me", {me : onlineUsers[id].username});
    }
});

app.get('/logout', function(req, res) {
    res.cookie("id", "", {maxAge: -1000});
    res.render("login", {state : true});
});

app.get('/new', function(req, res, next){
    var id = req.cookies.id;
    if (!onlineUsers[id])
        res.redirect("/");
    res.render("me", {me : onlineUsers[id].username});
});

app.post('/new', function(req, res){
    var id = req.cookies.id,
        me = onlineUsers[id];
    if (!me) {
        res.redirect('/login');
        return;
    }
    var room = utils.getNewRoom(currentRooms);
    me.currentRoom = room;
    me.isChatting = true;
    currentRooms[room] = {
        roomName : req.body.name,
        chatters:
            [me.username]
    };
    console.log(currentRooms);
    res.redirect("/room/" + room);
});


app.get('/pick', function(req, res){
    var id = req.cookies.id,
        me = onlineUsers[id];
    if (!me) {
        res.redirect("/login");
        return;
    }
    var roomRandom = utils.getRandomRoom(currentRooms);
    me.currentRoom = roomRandom;
    me.isChatting = true;
    if (currentRooms[roomRandom].chatters.indexOf(me.username) == -1)
        currentRooms[roomRandom].chatters.push(me.username);
    console.log(currentRooms);
    res.redirect("/room/" + roomRandom);
});

/* GET users listing. */
app.all('/room/:id([0-9]+)', function(req, res) {
    var userId = req.cookies.id,
        me = onlineUsers[userId],
        roomId = req.params.id,
        chatters,
        pos;

    console.log(onlineUsers);
    console.log(currentRooms);

    if (!me || !currentRooms[roomId]){
        res.redirect("/");
        return;
    }

    if (me.isChatting && roomId != me.currentRoom) {
        utils.changeUserStatus(onlineUsers, currentRooms, userId);
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
    res.render("game", {
        roomInfo: currentRooms[roomId],
        chatters: chatters,
        me: me
    });
});

app.get('/room/exit/:id([0-9]+)', function(req, res){
    var id = req.cookies.id,
        me = onlineUsers[id],
        room;
    if (!me){
        res.redirect("/");
        return;
    }
    utils.changeUserStatus(onlineUsers, currentRooms, id);
    res.redirect("/me");
});


app.use(function (req, res) {
    res.status(404);
    res.send("Not Found");
});


io.on( 'connection', function( socket ) {
    console.log( 'New user connected' );

    socket.on('add', function (data) {
        console.log(data);
        roomList[data.room] = data.playlist;
        socket.broadcast.to(data["room"]).emit('add', data);
    });

    socket.on('remove', function (data) {
        console.log(data);
        roomList[data.room] = data.playlist;
        socket.broadcast.to(data["room"]).emit('remove', data);
    });

    socket.on("join", function(data) {
        socket.join(data.room);
        socket.broadcast.to(data.room).emit("newClient", data.username);
        console.log("join", data);
    });


    socket.on("exit", function(data) {
        socket.join(data.room);
        socket.broadcast.to(data.room).emit("exitClient", data.username);
        console.log("exit", data);
    });
});
