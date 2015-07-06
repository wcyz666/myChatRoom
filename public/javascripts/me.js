/**
 * Created by lenovo on 2015/5/2.
 */
(function(){
    var myLib = (function(){
        var curURL = window.location.href,
            roomNum = /^.*\/(.*)$/.exec(window.location.href)[1];

        return {
            roomNum: roomNum,
            el : function(id, rg){
                var range = rg || document;
                return range.getElementById(id);
            },
            qs : function(selector, rg){
                var range = rg || document;
                return range.querySelector(selector);
            },
            ajax : function(opt) {
                opt = opt || {};
                var xhr = (window.XMLHttpRequest)
                        ? new XMLHttpRequest()
                        : new ActiveXObject("Microsoft.XMLHTTP"),
                    async = opt.async !== false,
                    success = opt.success || null,
                    error = opt.error || function(){alert('AJAX Error: ' + this.status)};

                xhr.open(opt.method || 'GET', opt.url || '', async);

                if (opt.method == 'POST')
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                if (async)
                    xhr.onreadystatechange = function(){
                        if (xhr.readyState == 4) {
                            var status = xhr.status, response = xhr.responseText;
                            if ((status >= 200 && status < 300) || status == 304 || status == 1223) {
                                success && success(response);
                            } else if (status >= 500)
                                error();
                        }
                    };
                xhr.onerror = function(){error()};

                xhr.send(opt.data || null);
            }
        };
    })();

    var msg = Messenger();
    msg.post({
        message: "Welcome, " + $("#username").text() + " !",
        hideAfter: 10,
        hideOnNavigate: true
    });


    $('#newRoom').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        var modal = $(this);
    });

    $('#joinRoom').on('click', function (event) {
        $.get("/api/allRooms", function(data){
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
