
window.onload = function(){

    var socket,
        content = $('#chatroom-content'),
        text = $('#chatroom-text'),
        userID = /\/(\d+)\.\w+$/.exec($("img[width]").attr("src"))[1],
        msg = Messenger();

    var myLib = (function(){

        var qrid = "qrcode",
            curURL = window.location.href,
            roomNum = /^.*\/(.*)$/.exec(window.location.href)[1],
            userName = $("#username").text(),
            lastTime = new Date(),
            width = $("#game").width() * 0.5;

        return {
            userID: userID,
            roomNum: roomNum,
            getTime: function() {
                var now = new Date(),
                    wordsToHtml = '<p class="text-center small" id="datetime"></p>';
                if ((now - lastTime) / 1000 > 120 ) {
                    wordsToHtml = '<p class="text-center small" id="datetime">' + new Date().toLocaleString() + '</p>';
                }
                lastTime = now;
                return wordsToHtml;
            },
            getWordsTemplate : function (words){
                var wordsToHtml = myLib.getTime();
                return wordsToHtml + '<div class="pull-right"><img class="media-object" width="48" src="/avatar/' + userID + '.png" alt="avatar">'+
                '</div><div class="media-body pull-right col-xs-8"><p class="bg-primary text-right col-xs-12">' + words +
                '</p></div><div class="clearfix"></div>';
            },
            getOtherWordsTemplate : function (username, words, userID){
                var wordsToHtml = myLib.getTime();
                return wordsToHtml + '<div class="pull-left"><img width="48" class="media-object" src="/avatar/' + userID + '.png" alt="avatar">' +
                '</div><div class="media-body"><h4 class="media-heading">' + username + '</h4><p class="bg-info  col-xs-8">' + words +
                '</p></div><div class="clearfix"></div>';
            },
            getImageTemplate: function (src) {
                var wordsToHtml = myLib.getTime();
                return wordsToHtml + '<div class="pull-right"><img class="media-object" width="48" src="/avatar/' + userID + '.png" alt="avatar">'+
                    '</div><div class="media-body pull-right col-xs-8"><img class="pull-right" width="' + width + '" src="/userImages/' + src +
                    '"/></div><div class="clearfix"></div>';
            },
            getOtherImageTemplate : function (username, src, userID){
                var wordsToHtml = myLib.getTime();
                return wordsToHtml + '<div class="pull-left"><img width="48" class="media-object" src="/avatar/' + userID + '.png" alt="avatar">' +
                    '</div><div class="media-body"><h4 class="media-heading">' + username + '</h4><img width="' + width + '" src="/userImages/' + src +
                    '"/></div><div class="clearfix"></div>';
            },
            username: userName,
            createNode : function(tag, child, attrs){
                var outerTag = document.createElement(tag),
                    content,
                    i,
                    length;
                if (typeof child === "string"){
                    content = document.createTextNode(child);
                    outerTag.appendChild(content);
                }
                else {
                    if (child instanceof Array){
                        for (i = 0, length = child.length; i < length; i++) {

                            content = child[i];
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
            createNewUser: function(user){
                var html = "";
                html += '<li class="li-name"><span class="label label-default player-name">' + user + '</span>';
                html += '<button class="btn btn-success pull-right btn-sm" type="button">';
                html += '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Friend </button></li>';
                return $(html);
            }
        };
    })();

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


        socket.on("exitClient", function(newUser){

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

        socket.on("otherImage", function(newImage){

            var otherImage = myLib.getOtherImageTemplate(newImage.username, newImage.imageName, newImage.userID);
            content.append(otherImage);
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
            var myWords = myLib.getWordsTemplate(text.val());

            if (text.val() === "")
                return false;
            socket.emit('sendWords', {
                room: myLib.roomNum,
                username: myLib.username,
                words: text.val(),
                userID : myLib.userID
            });
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

        $("#upload-image").on("submit", function(event) {
            var formData = new FormData($("#upload-image")[0]);

            event.preventDefault();
            $.ajax({
                url: '/chat/imageUpload',  //server script to process data
                type: 'POST',
                xhr: function() {  // custom xhr
                    var myXhr = $.ajaxSettings.xhr();
                    return myXhr;
                },
                //Ajax events
                success: function(data) {
                    var myImage = myLib.getImageTemplate(data.imageName);
                    content.append(myImage);
                    content.animate(
                        {
                            scrollTop:content[0].scrollHeight
                        }, 500);
                    socket.emit('sendImage', {
                        room: myLib.roomNum,
                        username: myLib.username,
                        imageName: data.imageName,
                        userID : myLib.userID
                    });
                },
                error: function(data) {
                    console.log(data);
                },
                // Form data
                data: formData,
                //Options to tell JQuery not to process data or worry about content-type
                cache: false,
                contentType: false,
                processData: false
            }, 'json');
            $('#exampleModal').modal("hide");
        });

        return {
            init : function () {
                myLib.createQRcode();
                myLib.el('exit').setAttribute("href", "/room/exit/" + myLib.roomNum);
            }
        };
    })().init();
};

