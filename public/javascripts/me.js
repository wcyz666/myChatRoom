/**
 * Created by lenovo on 2015/5/2.
 */
(function(){
    var myLib = (function(){
        var roomNum = /^.*\/(.*)$/.exec(window.location.href)[1];

        return {
            el: function(id, doc) {
                var range = doc || document;
                return range.getElementById(id);
            },
            roomNum: roomNum
        };
    })();

    var msg = Messenger();
    msg.post({
        message: "Welcome, " + $("#username").text() + " !",
        hideAfter: 10,
        hideOnNavigate: true
    });
    $("[name='isPublic']").bootstrapSwitch();
    $("#private").hide();

    $('input[name="isPublic"]').on('switchChange.bootstrapSwitch', function(event, state) {
        $("#private").slideToggle();
    });

    $('#joinRoom').on('click', function (event) {
        $.get("/api/allRooms", function(data){
            var roomNum,
                tableBody = "",
                privateClass;

            for (roomNum in data) {
                privateClass = data[roomNum].isPublic ? "" : "class='warning'";
                tableBody += "<tr " + privateClass + "><td> " + roomNum + " </td>";
                tableBody += "<td>" + data[roomNum].roomName + "</td>";
                tableBody += "<td>" + data[roomNum].chatters.length + "</td>";
                tableBody += "<td><a type='button' class='btn btn-success btn-sm' href='/room/" + roomNum + "'>Enter</a></td></tr>";
                if (!data[roomNum].isPublic) {
                    tableBody += "<tr class='hidden-input'><td>Input Room Password: </td><td colspan='2'><input type='password' name='password' /></td><td id='button-pos'></td></tr>";
                }
            }
            myLib.el("table-body").innerHTML = tableBody;
            $(".hidden-input").hide();
            $('.warning').each(function(index, element) {
                $(element).find('td').eq(0).append('<span class="glyphicon glyphicon-lock" aria-hidden="true"></span>');
                $(element).find('a').on('click', function(event){
                    var hide = $(this).parent().parent().next();
                    if (!$(this).parent().is("#button-pos")) {
                        event.preventDefault();

                        hide.slideDown();
                        $(this).appendTo(hide.find('td').eq(2));
                    }
                    else {
                        location.href = $(this).attr("src") + "?password=" + (hide.find('input').val());
                    }
                })

            });
        });
    });

    $('#pickRoom').on('click', function(event){
        event.preventDefault();
        $.get('/api/roomCount', function(data){
            if (data.roomCount == 0)
                alert("No rooms available");
            else
                window.location.href = "/pick";
        });
    });

})();
