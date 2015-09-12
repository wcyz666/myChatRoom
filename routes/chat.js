/**
 * Created by ASUA on 2015/9/5.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    fs = require("fs"),
    uuid = require('node-uuid'),
    multipartMiddleware = require('connect-multiparty')(),
    utils = require('../my_modules/utils');

router.get('/loadPrevMsg', function(req, res){
    var time = req.query.nowTime,
        room = req.query.room;

    db.all("SELECT * FROM record_archive WHERE room_id = ? AND post_time < datetime(?, 'unixepoch', 'localtime') ORDER BY record_id DESC LIMIT 20;", [room, time], function(err, rows){
        var i, length,
            data = [],
            item,
            result,
            newTime;

        if (err) throw err;
        for (i = 0, length = rows.length; i < length; i++) {
            item = rows[i];
            data.unshift({
                username: item['user_name'],
                userID: item['user_id'],
                content: item.content,
                time: item['post_time'],
                type: item.type
            });
        }
        newTime = (data.length > 0) ?  Date.parse(data[0].time) / 1000 : time;
        result = {
            status: 200,
            data: data,
            dataCount: data.length,
            newTime: newTime
        };
        res.json(result);
    });
});

router.post('/imageUpload',multipartMiddleware, function(req, res){
    var image = req.files.image,
        ext = '.' + req.files.image.type.split("/")[1],
        imageID = uuid.v4(),
        path = __dirname + "/../public/userImages/" + imageID + ext;
    if (!req.session.isLogin || !ext.match(/jpe?g|gif|png/i)) {
        res.json({
            status: "FAIL",
            cause: "Unauthenticated user"
        });
    }
    else {
        async.waterfall([
                function (callback) {
                    fs.readFile(image.path, function (err, data) {
                        callback(err, data);
                    });
                },
                function (data, callback) {
                    fs.writeFile(path, data, function (err) {
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
                else {
                    res.json({
                        status: "OK",
                        imageName: imageID + ext
                    });
                }
            }
        );
    }
});

router.get('/exit/:id([0-9]+)', function(req, res){
    var me = req.session.userInfo,
        room;
    if (!me){
        res.redirect("/");
        return;
    }
    room = me.currentRoom;
    if (utils.changeUserStatus(currentRooms, me)) {
        db.run("DELETE FROM record_archive WHERE room_id = ?", [room]);
    }
    res.redirect("/me");
});

module.exports = router;