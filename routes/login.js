/**
 * Created by ASUA on 2015/9/5.
 */
var express = require('express'),
    router = express.Router(),
    md5 = require('MD5');

router.get("/", function(req, res){
    res.redirect("/");
});

router.post('/', function (req, res) {
    var pwdhash,
        cookie,
        sql = "",
        inserts = [];

    if (req.body.username && req.body.password) {
        pwdhash = md5(req.body.username + req.body.password);
        sql = "SELECT * FROM user WHERE password = ?";
        inserts = [pwdhash];
        if (req.session.userInfo && pwdhash == req.session.userInfo.pwd) {
            req.session.isLogin = true;
            res.redirect("me");
        }
        else {
            db.all(sql, inserts, function (err, rows) {
                if (err) throw err;
                if (rows.length > 0) {

                    req.session.regenerate(function () {
                        req.session.userInfo = {
                            userID: rows[0].id,
                            username: rows[0].username,
                            pwd: rows[0].password,
                            isChatting: false,
                            currentRoom: -1
                        };
                        req.session.isLogin = true;

                        res.redirect("me");
                    });
                }
                else {
                    res.render("login", {state: false});
                }
            });
        }
    }
    else {
        res.render("login", {state: false});
    }
});

module.exports = router;