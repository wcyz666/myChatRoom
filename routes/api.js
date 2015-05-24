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
    if (!onlineUsers[req.cookies.id]){
        res.redirect("/");
        return;
    }
    res.json(currentRooms);
});

module.exports = router;
