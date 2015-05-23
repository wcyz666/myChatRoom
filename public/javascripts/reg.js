/**
 * Created by lenovo on 2015/5/1.
 */


window.onload = function(){
    $.backstretch([
        "../images/bg1.jpg",
        "../images/bg2.jpg"
    ], {duration: 3000, fade: 750});
    $('#warning').hide();
    document.forms[0].onsubmit = function(){
        if (document.getElementById('password').value != document.getElementById('password-again').value){
            $('#warning').show();
            return false;
        }
    }
};
