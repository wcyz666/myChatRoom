
window.onload = function(){

    var socket;

    var myLib = (function(){

        var qrid = "qrcode",
            curURL = window.location.href,
            roomNum = /^.*\/(.*)$/.exec(window.location.href)[1],
            userName = $("#username").text();

        return {
            roomNum: roomNum,
            username: userName,
            el : function(id, rg){
                var range = rg || document;
                return range.getElementById(id);
            },
            qs : function(selector, rg){
                var range = rg || document;
                return range.querySelector(selector);
            },
            qsa : function(selector, rg){
                var range = rg || document;
                return range.querySelectorAll(selector);
            },
            createNode : function(tag, child, attrs){
                var outerTag = document.createElement(tag);
                var content;
                if (typeof child === "string"){
                    content = document.createTextNode(child);
                    outerTag.appendChild(content);
                }
                else {
                    if (child instanceof Array){
                        for (var _index in child) {
                            var index = parseInt(_index);
                            if (isNaN(_index)) continue;
                            content = child[index];
                            if (typeof content === "string") {
                                content = document.createTextNode(content);
                            }
                            else if (typeof content === "function")
                                continue;
                            outerTag.appendChild(content);
                        }
                    }
                    else{
                        outerTag.appendChild(child);
                    }
                }

                for (var key in attrs) {
                    outerTag.setAttribute(key, attrs[key]);
                }
                return outerTag;
            },
            createQRcode : function(){
                myLib.el(qrid).src = "https://chart.googleapis.com/chart?cht=qr&chs=500x500&chl=" + encodeURIComponent(curURL);
            },
            getCurrentUsers : function() {

            },
            createNewUser: function(user){
                var html = "";
                html += '<li role="presentation" class="active">';
                html += '<h3><span class="label label-default pull-left player-name">' + user + '</span>';
                html += '<button class="btn btn-success pull-right btn-sm" type="button">';
                html += '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Friend </button></h3></li>';
                return $(html);
            }
        };
    })();

    var msg = Messenger();
    var firstPlay = true;

    (function (){

        socket = io();
        socket.on("newClient", function(newUser){
            if ($(".player-name").text().indexOf(newUser) != -1 || newUser == myLib.username) return;

            $("#players").append(myLib.createNewUser(newUser));
            msg.post({
                message: "User " + newUser + " comes in !",
                hideAfter: 10,
                hideOnNavigate: true
            });
        });

        addEventListener('keyup', function(event) {
            console.log(event.keyCode);
            if (event.keyCode == 38 || event.keyCode == 87) {
                socket.emit("jump", {
                    room: myLib.roomNum,
                    username: myLib.username
                });
            }
            else if (event.keyCode == 39) {
                console.log({
                    room: myLib.roomNum,
                    username: myLib.username,
                    propNum: gameObj.getPropNum()
                });
                socket.emit("prop", {
                    room: myLib.roomNum,
                    username: myLib.username,
                    propNum : gameObj.getPropNum()
                });
                gameObj.prop();
            }
            event.stopPropagation();
        });

        socket.on("prop", function(data){
            gameObj.setProp(data.propNum);
        });

        socket.on("onJump", function(data){
            setTimeout(gameObj.keyPress(), 1000);
        });

        socket.on("exitClient", function(newUser){
            $("li:contains(" + newUser.trim() + ")").remove();
            msg.post({
                message: "User " + newUser + " exit !",
                hideAfter: 10,
                hideOnNavigate: true
            });
        });

        socket.on("backToMe", function(){
            msg.post({
                message: "You will be directed to Me page in 5 seconds !",
                hideAfter: 5,
                hideOnNavigate: true
            });
            setTimeout(function(){
                window.location.href = "/room/exit/" + myLib.roomNum;
            }, 5000);
        });

        socket.on("newReady", function(newUser){
            msg.post({
                message: "User " + newUser + " is ready !",
                hideAfter: 10,
                hideOnNavigate: true
            });
        });

        socket.on("start", function(roomInfo){
            var counter = $('#seconds'),
                timer;

            msg.post({
                message: "Game Start!",
                hideAfter: 10,
                hideOnNavigate: true
            });
            gameObj.playerCount(roomInfo.userNum);
            gameObj.mapSelect(parseInt($("#mapName").text().split(' ')[1]) - 1);
            $('#myModal').modal("show");
            (function countDown() {
                var result = parseInt(counter.text());
                if (result == 0) {
                    $('#myModal').modal("hide");
                    $("#readyButton").button('reset');
                    if (firstPlay) {
                        counter.text(5);
                        gameObj.start();
                        firstPlay = false;
                    }
                    posSync = setInterval(function () {
                        socket.emit("posSync", {
                            room: myLib.roomNum,
                            pos: gameObj.getPosition(),
                            userName: myLib.username
                        });
                    }, 10);
                }
                else {
                    result--;
                    counter.text(result);
                    setTimeout(countDown, 1000);
                }
            })();
    });

    $("#readyButton").on('click', function () {
        var $btn = $(this).button('loading');
        msg.post({
            message: "You are ready !",
            hideAfter: 10,
            hideOnNavigate: true
        });
        socket.emit("ready", {
            room: myLib.roomNum,
            username: myLib.username
        });
    });

    socket.emit("join", {
        room: myLib.roomNum,
        username: myLib.username
    });

    socket.on("gameOver", function(data){
        var scoreSummary;
        if (myLib.username == data.winner) {
            scoreSummary = "You have won 20 points!"
        }
        else {
            scoreSummary = "You have lost 20 points!"
        }
        msg.post({
            message: "Game End! The winner is " + data.winner + ", " + scoreSummary,
            hideAfter: 10,
            hideOnNavigate: true
        });
    });

    socket.on("posSync", function(data) {
        gameObj.setPosition(data);
    });

    $('#exit').on('click', function(event){
        socket.emit('exit', {
            room: myLib.roomNum,
            username: myLib.username
        });
        return true;
    });

    return {
        init : function () {
            myLib.createQRcode();
            myLib.el('exit').setAttribute("href", "/room/exit/" + myLib.roomNum);
        }
    };
    })().init();
};

