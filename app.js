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
    fs = require("fs"),
    im = require('imagemagick'),
    multipart = require('connect-multiparty'),
    multipartMiddleware = multipart(),
    uuid = require('node-uuid'),
    async = require('async'),
    session = require('express-session');


app.engine("handlebars", handlebars.engine);
app.set("view engine", 'handlebars');
app.use(cookieParser());
app.use( bodyParser.json() );       // to support JSON-encoded bodies
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

    console.log('Example app listening at http://%s:%s', host, port)

});

var io = socketIO(server);
currentRooms = {};

app.use("/api", api);

app.get('/', function(req, res){

    var session = req.session;
    console.log(session);
    if (req.session.isLogin){
        res.redirect("me");
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

        db.all(sql, inserts, function(err, rows) {
            if (err) throw err;
            if (rows.length > 0) {

                req.session.userInfo = {
                    userID: rows[0].id,
                    username : rows[0].username,
                    isChatting: false,
                    currentRoom : -1
                };
                req.session.isLogin = true;

                res.redirect("me");
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

app.get('/reg/nameValidate', function(req, res) {

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


app.post('/reg', multipartMiddleware, function(req, res){
    console.log(req.files);
    var pwdhash,
        sql = "",
        inserts = [],
        username = req.body.username,
        password = req.body.password,
        avatar = req.files.avatar;

    if (username && password) {
        pwdhash = md5(username + password);

        sql = "INSERT INTO user VALUES (NULL, ?, ?, '', 0)";
        inserts = [username, pwdhash];
        db.run(sql, inserts, function(err, rows) {
            if (err) throw err;
            db.get("SELECT id FROM user WHERE username = ?", [username], function(err, row) {
                if (err) throw err;

                async.waterfall([
                    function (callback) {
                        fs.readFile(avatar.path, function (err, data) {
                            callback(err, data);
                        });
                    },
                    function (data, callback) {
                        var path = __dirname + "/public/avatar/" + row.id + '.png';
                        fs.writeFile(path, data, function (err){
                            callback(err, null)
                        });
                    }],
                    function (err, result) {
                        req.session.userInfo = {
                            userID: row.id,
                            username: username,
                            isChatting: false,
                            currentRoom : -1
                        };
                        req.session.isLogin = true;
                        res.redirect("me");
                    }
                );
            });
        });
    }
    else {
        res.redirect('/reg.html');
    }
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
    res.render("me", {me : session.userInfo.username});
});

app.post('/new', function(req, res){
    var me = req.session.userInfo,
        room = 0;
    if (!me) {
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
    console.log(currentRooms);
    res.redirect("/room/" + room);
});


app.get('/pick', function(req, res){
    var me = req.session.userInfo;

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

app.post('/chat/imageUpload',multipartMiddleware, function(req, res){
    var image = req.files.image,
        ext = '.' + req.files.image.type.split("/")[1],
        imageID = uuid.v4(),
        path = __dirname + "/public/userImages/" + imageID + ext;

    async.waterfall([
        function (callback) {
            fs.readFile(image.path, function (err, data){
                callback(err, data);
            });
        },
        function (data, callback) {
            fs.writeFile(path, data, function (err){
                callback(err, null)
            });
        }],
        function (err, result) {
            if (err) {
                res.json({
                    status: "FAIL",
                    cause: err
                });
            }
            else{
                res.json({
                    status: "OK",
                    imageName: imageID + ext
                });
            }
        }
    );
});


/* GET users listing. */
app.all('/room/:id([0-9]+)', function(req, res) {
    var me = req.session.userInfo,
        roomId = req.params.id,
        chatters,
        pos;

    console.log(currentRooms);

    if (!me || !currentRooms[roomId]){
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
    res.render("game", {
        roomInfo: currentRooms[roomId],
        chatters: chatters,
        me: me
    });
});

app.get('/room/exit/:id([0-9]+)', function(req, res){
    var me = req.session.userInfo,
        room;
    if (!me){
        res.redirect("/");
        return;
    }
    utils.changeUserStatus(currentRooms, me);
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

    socket.on('sendWords', function(data){
        socket.join(data.room);
        socket.broadcast.to(data.room).emit('otherWords', data);
        console.log("words", data);
    });

    socket.on('sendImage', function(data){
        socket.join(data.room);
        socket.broadcast.to(data.room).emit('otherImage', data);
        console.log("image", data);
    });
});
