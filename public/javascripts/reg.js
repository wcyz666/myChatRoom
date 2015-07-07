/**
 * Created by lenovo on 2015/5/1.
 */


window.onload = function(){
    var userNameInput = $("#username"),
        warning = $('#warning'),
        parent = userNameInput.parent(),
        usernameHint = $("#usernameHint"),
        warningText = $("#warningText");

    $.backstretch([
        "../images/bg1.jpg",
        "../images/bg2.jpg"
    ], {duration: 3000, fade: 750});
    warning.hide();

    userNameInput.on('blur', function(){
        if (userNameInput.val().length == 0)
            return false;
        $.get("/nameValidate", {
                name: userNameInput.val().trim()
            },
            function (data) {

                if (data.isValid) {

                    usernameHint.removeClass("invisible").text("OK to use!");
                    if (!parent.hasClass("has-success")) {
                        parent.addClass("has-success");
                    }
                    parent.removeClass("has-error");
                }
                else {
                    usernameHint.removeClass("invisible").text("Has been registered.");
                    parent.removeClass("has-success");
                    if (!parent.hasClass("has-error")) {
                        parent.addClass("has-error");
                    }
                }
            },
            "json")
    });
    document.forms[0].onsubmit = function(){

        if (document.getElementById('password').value != document.getElementById('password-again').value){
            warningText.text("Password not match");
            warning.show();
            return false;
        }
        if (!userNameInput.parent().hasClass("has-success")){
            warningText.text("Username not valid");
            warning.show();
            return false;
        }
    }
};
