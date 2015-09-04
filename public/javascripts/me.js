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
            console.log(data);
            var roomNum,
                tableBody = "";
            for (roomNum in data) {
                tableBody += "<tr><td>" + roomNum + "</td>";
                tableBody += "<td>" + data[roomNum].roomName + "</td>";
                tableBody += "<td>" + data[roomNum].chatters.length + "</td>";
                tableBody += "<td><a type='button' class='btn btn-success btn-sm' href='/room/" + roomNum + "'>Enter</a></td>";
            }
            myLib.el("table-body").innerHTML = tableBody;
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
