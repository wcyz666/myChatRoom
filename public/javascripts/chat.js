var socket = io();

$(document).ready(function() {

      var  content = $('#chatroom-content'),
        text = $('#chatroom-text'),
        userID = /\/(\d+)\.\w+$/.exec($("img[width]").attr("src"))[1],
        msg = Messenger(),
        fileUploader = $('<input type="file" class="form-control" id="image" name="image" required="required">'),
        prevDelim = $('<div class="text-center">------- Old Messages --------</div>'),
        unviewMsg = 0,
        pageIsFocus = true,
        loadTime = Date.parse(new Date()) / 1000;

    var myLib = (function(){

        var qrid = "qrcode",
            curURL = window.location.href,
            roomNum = /^.*\/(.*)$/.exec(window.location.href)[1],
            userName = $("#username").text().trim(),
            lastTime = new Date(),
            width = $("#game").width() * 0.3;

        return {
            username: userName,
            userID: userID,
            roomNum: roomNum,

            getDelim: function() {
                return prevDelim.clone();
            },
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
                '</div><div class="media-body word-content pull-right"><p class="bubble-self words col-xs-12">' + words.replace(/\n/g, "<br>") +
                '</p></div><div class="clearfix"></div>';
            },
            getOtherWordsTemplate : function (words, username, userID){
                var wordsToHtml = myLib.getTime();
                return wordsToHtml + '<div class="pull-left"><img width="48" class="media-object" src="/avatar/' + userID + '.png" alt="avatar">' +
                '</div><div class="media-body"><h4 class="media-heading">' + username + '</h4><p class="words bubble-other">' + words.replace(/\n/g, "<br>") +
                '</p></div><div class="clearfix"></div>';
            },
            getImageTemplate: function (src) {
                var wordsToHtml = myLib.getTime();
                return wordsToHtml + '<div class="pull-right"><img class="media-object" width="48" src="/avatar/' + userID + '.png" alt="avatar">'+
                    '</div><div class="media-body pull-right col-xs-9"><img class="pull-right img-thumbnail" width="' + width + '" src="/userImages/' + src +
                    '"/></div><div class="clearfix"></div>';
            },
            getOtherImageTemplate : function (src, username, userID){
                var wordsToHtml = myLib.getTime();
                return wordsToHtml + '<div class="pull-left"><img width="48" class="media-object" src="/avatar/' + userID + '.png" alt="avatar">' +
                    '</div><div class="media-body"><h4 class="media-heading">' + username + '</h4><img class="img-thumbnail" width="' + width + '" src="/userImages/' + src +
                    '"/></div><div class="clearfix"></div>';
            },
            createQRcode : function(){
                $('#' + qrid).attr('src', "https://chart.googleapis.com/chart?cht=qr&chs=500x500&chl=" + encodeURIComponent(curURL));
            },
            getFileUploaderCopy : function() {
                return fileUploader.clone();
            },
            createNewUser: function(user){
                var html = '<li class="li-name"><span class="label label-default player-name">' + user + '</span></li>';

                return $(html);
            },
            msgCallback: function() {
                if (!pageIsFocus) {
                    ++unviewMsg;
                    document.title = unviewMsg + " messages - ChatRoom 18-652";
                }
            }
        };
    })();

    (function (){

        socket.on("otherWords", function(newWords){
            var otherWords = myLib.getOtherWordsTemplate(newWords.words, newWords.username, newWords.userID);
            content.append(otherWords).animate(
                {
                    scrollTop:content[0].scrollHeight
                }, 500);
            myLib.msgCallback();
        });

        socket.on("otherImage", function(newImage){

            var otherImage = myLib.getOtherImageTemplate(newImage.imageName, newImage.username, newImage.userID);
            content.append(otherImage).animate(
                {
                    scrollTop:content[0].scrollHeight
                }, 500);
            myLib.msgCallback();
        });


        $(document).keydown(function(event){
            if (event.keyCode == 13 || event.keyCode == 108) {
                if (event.shiftKey) {
                    $('#sendMsg').click();
                    return false;
                }
            }
        });
        $("#game").on('click', function(event){
            event.stopPropagation();

            switch (event.target.id){
                case "sendPic-span":
                case "sendPic":
                    $("input[type='file']").remove();
                    $("#file-uploader").append(myLib.getFileUploaderCopy());
                    $('#exampleModal').modal("show");
                    break;
                case "sendMsg":
                case "sendMsg-span":
                    var myWords = myLib.getWordsTemplate(text.val());

                    if (text.val().trim() === "")
                        return false;
                    socket.emit('sendWords', {
                        room: myLib.roomNum,
                        username: myLib.username,
                        words: text.val().replace(/^\s+$/, ""),
                        userID : myLib.userID
                    });
                    text.val("");
                    content.append(myWords).animate(
                        {
                            scrollTop:content[0].scrollHeight
                        }, 500);
                    myLib.msgCallback();
                    break;
                case "loadMsg":
                    var that = $(event.target);
                    that.addClass('disabled');
                    $('#loading').removeClass('hidden');

                    $.get('/chat/loadPrevMsg', {
                        nowTime: loadTime,
                        room: myLib.roomNum
                    }, function (result) {
                        var i = result.dataCount,
                            item,
                            who,
                            type;

                        if (i == 0) {
                            $('#loading').addClass('hidden').next().removeClass('hidden');
                        }
                        else {
                            loadTime = result.newTime;
                            content.prepend(myLib.getDelim());
                            for (i--; i >= 0; i--) {
                                item = result.data[i];
                                who = item.username == myLib.username ? "" : "Other";
                                type = (item.type == 0) ? "Words" : "Image";
                                content.prepend(myLib['get' + who + type + 'Template'](item.content, item.username, item.userID));
                            }
                            if (result.dataCount < 20) {
                                $('#loading').addClass('hidden').next().removeClass('hidden');
                            }
                            else {
                                that.removeClass('disabled');
                                $('#loading').addClass('hidden');
                            }
                        }
                    });
                    break;
                default:
                    if (event.target.className.indexOf("img-thumbnail") !== -1) {
                        $('#zoom-out').modal("show");
                        var imgZoom = new Image();
                        imgZoom.onload = function () {
                            $('#zoom-out').find("img").replaceWith(imgZoom);
                        };
                        imgZoom.className = "img-responsive center-block";
                        imgZoom.src = event.target.src;

                    }
            }
        });

        $('#exit').on('click', function(event){
            socket.emit('exit', {
                room: myLib.roomNum,
                username: myLib.username
            });
            return true;
        });

        $("#upload-button").on("click", function(event) {
            $("#file-uploader").append(myLib.getFileUploaderCopy());
        });

        $(window).focus(function(){
            unviewMsg = 0;
            pageIsFocus = true;
            document.title = "ChatRoom 18-652";
        });

        $(window).blur(function(){
            pageIsFocus = false;
        });

        $("#upload-image").on("submit", function(event) {

            var form = document.createElement("form"),
                formData,
                images = $("#upload-image input[type='file']"),
                length =images.size(),
                i;

            event.preventDefault();

            for (i = 0; i < length; i++) {
                $(form).append(images.get(i));
                formData = new FormData(form);
                $.ajax({
                    url: '/chat/imageUpload',
                    type: 'POST',
                    // Form data
                    data: formData,
                    //Options to tell JQuery not to process data or worry about content-type
                    cache: false,
                    contentType: false,
                    processData: false
                }, 'json').success( function(data) {
                    var myImage = myLib.getImageTemplate(data.imageName);

                    if (data.status != "FAIL" ) {
                        content.append(myImage);
                        content.animate(
                            {
                                scrollTop: content[0].scrollHeight
                            }, 500);
                        myLib.msgCallback();
                        socket.emit('sendImage', {
                            room: myLib.roomNum,
                            username: myLib.username,
                            imageName: data.imageName,
                            userID: myLib.userID
                        });
                    }
                }).error(function(data) {
                });
                $(form).empty();
            }

            $('#exampleModal').modal("hide");
        });

        return {
            init : function () {
                socket.emit("join", {
                    room: myLib.roomNum,
                    username: myLib.username
                });
                text.height($('#sendMsg').height());
                myLib.createQRcode();
                $('#exit').attr("href", "/chat/exit/" + myLib.roomNum);
            }
        };
    })().init();
});