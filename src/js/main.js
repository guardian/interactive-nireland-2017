//import iframeMessenger from 'iframe-messenger'

var el = document.createElement('script');
el.src = '<%= path %>/app.js';
document.body.appendChild(el);

//iframeMessenger.enableAutoResize();
//document.onscroll(setTimeout(function(){iframeMessenger.resize()},1))