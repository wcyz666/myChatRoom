var express = require('express');
var router = express.Router();

router.get('/roomCount', function(req, res){
    var key,
        count = 0;
    for (key in currentRooms)
        ++count;

    res.json({roomCount : count});
});

router.all('/allRooms', function(req, res) {
    if (!req.session.isLogin){
        res.redirect("/");
        return;
    }
    res.json(currentRooms);
});

router.get('/nameValidate', function(req, res) {

    db.all('SELECT * FROM user WHERE username = ?', [req.query.name], function(err, rows) {
        if (err) throw err;

        if (rows.length == 0)
            res.json({isValid : true});
        else
            res.json({isValid : false});
    });
});

module.exports = router;
