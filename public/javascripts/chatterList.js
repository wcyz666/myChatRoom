/**
 * Created by ASUA on 2015/9/20.
 */
var userName = $("#username").text().trim();
var roomNum = /^.*\/(.*)$/.exec(window.location.href)[1];
var ChatterList = React.createClass({
    getInitialState: function(){
        socket.on("exitClient", this.removeChatters);
        socket.on("newClient", this.addChatters);
        socket.on("roomMembersReply", this.syncChatters);
        socket.emit("roomMembers", {
            room: roomNum
        });
        return {
            chatters: []
        };
    },
    addChatters: function (data){
        var chatters = this.state.chatters;
        chatters.push(data);
        this.setState({
            chatters: chatters
        });
    },
    removeChatters: function (data) {
        this.setState({
            chatters: this.state.chatters.filter(function(element){
                            return !(element === data);
                        })
        })
    },
    syncChatters: function (data){

        this.setState({
            chatters: data.filter(function(element){
                return !(element === userName);
            })
        })
    },
    render: function() {
        return (
            <ul className="list-unstyled">
                <li className="li-name">
                    <span className="label label-primary player-name">
                        <span className="glyphicon glyphicon-user" aria-hidden="true"></span> {userName}
                    </span>
                </li>
                <OtherChatterList chatters={this.state.chatters}/>
            </ul>
        );
    }
});

var OtherChatterItem = React.createClass({
    render: function () {
        return (
            <li className="li-name">
                <span  className="label label-default player-name">{this.props.children}</span>
            </li>
        );
    }
});
var OtherChatterList = React.createClass({
    propTypes: {
        chatters: React.PropTypes.array.isRequired
    },
    render: function () {
        var chatters = this.props.chatters.map(function(element) {
            return (
                <OtherChatterItem key={element}>{element}</OtherChatterItem>
            );
        });
        return (
            <div>
                {chatters}
            </div>
        );
    }
});



React.render(
    <ChatterList />,
    document.getElementById("players")
);
