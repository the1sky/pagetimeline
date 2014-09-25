/**
 * Created by nant on 2014/8/4.
 */

exports.version = '0.1';

exports.module = function(pagetimeline,callback){
	callback( false, {message:'add redirects module done!'})
    pagetimeline.log('redirect...');
    pagetimeline.finishModule();


	var browser = pagetimeline.model.browser;

	browser.onResponseReceived(function(res){
		var status = res.response.status;
		if( status >= 300 && status < 400 && status !=304 ){
			var statusText = res.response.statusText;
			var url = res.response.url;
			var redirectUrl = res.response.redirectURL;
			var location = res.response.headers.Location;

			pagetimeline.incrMetric('redirects');
			pagetimeline.addOffender('redirects', url + ' is a redirect (HTTP ' + status + ' ' + statusText + ') ' +
				'to ' + ( redirectUrl || location ) );
		}
	});
}
