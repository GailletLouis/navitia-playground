function isUndefined(val) {
    return typeof val == "undefined";
}

String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

String.prototype.encodeURI = function() {
    var s = this;

    return encodeURIComponent(s);
};

String.prototype.decodeURI = function() {
    var s = this;

    return decodeURIComponent(s);
};