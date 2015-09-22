/**
 * Created by ASUA on 2015/9/18.
 */

var gulp = require("gulp"),
    connect = require("gulp-connect"),
    browserify = require('gulp-browserify'),
    concat = require("gulp-concat");

gulp.task('js', function() {
    gulp.src("./public/javascripts/chatterList.js")
        .pipe(browserify({
            transform: 'reactify'
        }))
        .pipe(gulp.dest("./public/dist/javascripts/"));
});

gulp.task("watch", function(){
    gulp.watch("./public/javascripts/chatterList.js", ["js"]);
});

gulp.task("default", ['js', "watch"]);
