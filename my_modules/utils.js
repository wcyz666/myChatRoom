/**
 * Created by lenovo on 2015/3/6.
 */

var utils = {

    getNewRoom: function(currentRooms){
        do {
            var room = Math.floor(Math.random() * 10000);
        } while (room in currentRooms);
        return room;
    },

    getRandomRoom: function(currentRooms){
        var key,
            roomList = [],
            roomRandom = 0,
            count = 0;
        for (key in currentRooms){
            roomList.push(key);
            count++;
        }
        return roomList[Math.floor(Math.random() * count)];
    }
};

module.exports = utils;