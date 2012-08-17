$(function () {
    Modernizr.prefixedCss = function (str) {
    str = Modernizr.prefixed(str);
    return str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');
  }
});