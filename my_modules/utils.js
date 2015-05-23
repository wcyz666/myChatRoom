/**
 * Created by lenovo on 2015/3/6.
 */
var mysql = require("mysql");

var utils = {

    getNewRoom: function(currentRooms){
        do {
            var room = Math.floor(Math.random() * 10000);
        } while (room in currentRooms);
        return room;
    }
}

module.exports = utils;