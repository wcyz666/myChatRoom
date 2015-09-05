/**
 * Created by lenovo on 2015/3/6.
 */

var utils = {

    getNewRoom: function(currentRooms){
        do {
            var room = Math.floor(Math.random() * 100000000);
        } while (room in currentRooms);
        return room;
    },

    getRandomRoom: function(currentRooms){
        var key,
            roomList = [],
            roomRandom = 0,
            count = 0;
        for (key in currentRooms){
            if (currentRooms[key].isPublic) {
                roomList.push(key);
                count++;
            }
        }
        return roomList[Math.floor(Math.random() * count)];
    },

    changeUserStatus : function(rooms, myInfo){
        var curRoom = myInfo.currentRoom,
            pos,
            chatters;
        myInfo.isChatting = false;
        myInfo.currentRoom = -1;
        if (curRoom in rooms) {
            chatters = rooms[curRoom].chatters;
            pos = chatters.indexOf(myInfo.username);
            if (pos != -1) {
                chatters.splice(pos, 1);
                if (chatters.length == 0) {
                    delete rooms[curRoom];
                    return true;
                }
            }
        }
        return false;
    }
};

module.exports = utils;