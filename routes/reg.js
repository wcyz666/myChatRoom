/**
 * Created by ASUA on 2015/9/5.
 */
var express = require('express'),
    router = express.Router(),
    multipartMiddleware = require('connect-multiparty')(),
    md5 = require('MD5'),
    fs = require("fs"),
    async = require('async');


router.post('/', multipartMiddleware, function(req, res){

    var pwdhash,
        sql = "",
        inserts = [],
        username = req.body.username,
        password = req.body.password,
        avatar = req.files.avatar;

    if (username && password) {
        pwdhash = md5(username + password);

        sql = "INSERT INTO user VALUES (NULL, ?, ?)";
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
                            var path = __dirname + "/../public/avatar/" + row.id + '.png';
                            fs.writeFile(path, data, function (err){
                                callback(err, null)
                            });
                        },
                        function (data, callback) {
                            req.session.regenerate(function(err){
                                callback(err, null) ;
                            });
                        }],
                    function (err, result) {
                        req.session.userInfo = {
                            userID: row.id,
                            username: username,
                            pwd: pwdhash,
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

module.exports = router;