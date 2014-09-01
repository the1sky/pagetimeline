/**
 * Created by nant on 2014/9/1.
 */
var Chrome = require( 'chrome-remote-interface' );
Chrome( function(chrome){
	with (chrome) {
		on('Network.requestWillBeSent', function (message) {
			console.log(message.request.url);
		});
		on('Page.loadEventFired', close);
		Network.enable();
		Page.enable();
		Page.navigate({'url': 'http://www.baidu.com'});
	}
}).on('error', function () {
	console.error('Cannot connect to Chrome');
});