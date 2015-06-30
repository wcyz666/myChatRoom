
window.onload = function(){

    var socket,
        content = $('#chatroom-content'),
        text = $('#chatroom-text'),
        userID = /\/(\d+)\.\w+$/.exec($("img[width]").attr("src"))[1];

    var myLib = (function(){

        var qrid = "qrcode",
            curURL = window.location.href,
            roomNum = /^.*\/(.*)$/.exec(window.location.href)[1],
            userName = $("#username").text(),
            lastTime = new Date();

        return {
            userID: userID,
            roomNum: roomNum,
            getWordsTemplate : function (words){
                var now = new Date(),
                    wordsToHtml = '<p class="text-center small" id="datetime"></p>';
                if ((now - lastTime) / 1000 > 120 ) {
                    wordsToHtml = '<p class="text-center small" id="datetime">' + new Date().toLocaleString() + '</p>';
                }
                lastTime = now;
                return wordsToHtml + '<div class="pull-right"><img class="media-object" width="48" src="/avatar/' + userID + '.png" alt="avatar">'+
                '</div><div class="media-body pull-right col-xs-8"><p class="bg-primary text-right col-xs-12">' + words +
                '</p></div><div class="clearfix"></div>';
            },
            getOtherWordsTemplate : function (username, words, userID){
                var now = new Date(),
                    wordsToHtml = '<p class="text-center small" id="datetime"></p>';
                if ((now - lastTime) / 1000 > 120 ) {
                    wordsToHtml = '<p class="text-center small" id="datetime">' + new Date().toLocaleString() + '</p>';
                }
                lastTime = now;
                return wordsToHtml + '<div class="pull-left"><img width="48" class="media-object" src="/avatar/' + userID + '.png" alt="avatar">' +
                '</div><div class="media-body"><h4 class="media-heading">' + username + '</h4><p class="bg-info  col-xs-8">' + words +
                '</p></div><div class="clearfix"></div>';
            },
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
                html += '<li class="li-name"><span class="label label-default player-name">' + user + '</span>';
                html += '<button class="btn btn-success pull-right btn-sm" type="button">';
                html += '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Friend </button></li>';
                return $(html);
            }
        };
    })();

    var msg = Messenger();
    var firstPlay = true;

    (function (){

        socket = io("http://127.0.0.1:3000");
        socket.on("newClient", function(newUser){
            if ($(".player-name").text().indexOf(newUser) != -1 || newUser == myLib.username) return;

            $("#players").append(myLib.createNewUser(newUser));
            msg.post({
                message: "User " + newUser + " comes in !",
                hideAfter: 10,
                hideOnNavigate: true
            });
        });


        socket.on("exitClient", function(newUser){
            console.log(newUser);
            $("li:contains(" + newUser.trim() + ")").remove();
            msg.post({
                message: "User " + newUser + " exit !",
                hideAfter: 10,
                hideOnNavigate: true
            });
        });

        socket.on("otherWords", function(newWords){
            console.log(newWords);
            var otherWords = myLib.getOtherWordsTemplate(newWords.username, newWords.words, newWords.userID);
            content.append(otherWords);
            content.animate(
                {
                    scrollTop:content[0].scrollHeight
                }, 500);
        });

        socket.emit("join", {
            room: myLib.roomNum,
            username: myLib.username
        });

        $(document).keydown(function(event){
            if (event.keyCode == 13 || event.keyCode == 108) {
                $('#sendMsg').click();
            }
        });
        $('#sendMsg').on('click', function(event) {

            if (text.val() === "")
                return false;
            socket.emit('sendWords', {
                room: myLib.roomNum,
                username: myLib.username,
                words: text.val(),
                userID : myLib.userID
            });
            var myWords = myLib.getWordsTemplate(text.val());
            text.val("");
            content.append(myWords);
            content.animate(
                {
                    scrollTop:content[0].scrollHeight
                }, 500);
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

