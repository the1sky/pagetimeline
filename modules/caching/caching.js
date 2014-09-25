/**
 *
 * Created by nant on 2014/8/4.
 */

//todo, not support pc chrome now

exports.version = '0.1';

exports.module = function(pagetimeline,callback){
    pagetimeline.log( 'caching...' );
	callback( false, {message:"add module caching done!"});

	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam('timeout');

	var cacheRequstId = {};
	var cacheRequestBody = [];

	pagetimeline.setMetric('caching_not_specified'); // @desc number of responses with no caching header sent (no Cache-Control header)
	pagetimeline.setMetric('caching_too_short'); // @desc number of responses with too short (less than a week) caching time
	pagetimeline.setMetric('caching_disabled'); // @desc number of responses with caching disabled (max-age=0)
	pagetimeline.setMetric('caching_old_headers');  // @desc number of responses with old, HTTP 1.0 caching headers (Expires and Pragma)

	browser.onRequestServedFromCache(function(res){
		cacheRequstId[res['requestId']] = res['requestId'];
	});

	browser.onResponseReceived(function(res){
		var requestId = res['requestId'];
		if( cacheRequstId[requestId] ){
			cacheRequestBody.push( res.response );
		}
	});

	browser.onLoadEventFired(function(res){
		setTimeout(function(){
			var len = cacheRequestBody.length;
			for( var i=0; i < len; i++ ){
				var url = cacheRequestBody[i].url;
				var headers = cacheRequestBody[i].headers;
				var ttl = getCachingTime( url, headers );
				if (ttl === false) {
					pagetimeline.incrMetric('caching_not_specified');
					pagetimeline.addOffender('caching_not_specified', url);
				}
				else if (ttl === 0) {
					pagetimeline.incrMetric('caching_disabled');
					pagetimeline.addOffender('caching_disabled', url);
				}
				else if (ttl < 7 * 86400) {
					pagetimeline.incrMetric('caching_too_short');
					pagetimeline.addOffender('caching_too_short', url + ' cached for ' + ttl + ' s');
				}
			}
            pagetimeline.finishModule();
		},timeout)
	});

	function getCachingTime(url, headers) {
		// false means "no caching"
		var ttl = false,
			headerName;
		var cacheControlRegExp = /max-age=(\d+)/;
		for (headerName in headers) {
			var value = headers[headerName];
			switch(headerName.toLowerCase()) {
				case 'cache-control':
					var matches = value.match(cacheControlRegExp);
					if (matches) {
						ttl = parseInt(matches[1], 10);
					}
					break;
				// catch Expires and Pragma headers
				case 'expires':
				case 'pragma':
				// and Varnish specific headers
				case 'x-pass-expires':
				case 'x-pass-cache-control':
					pagetimeline.incrMetric('caching_old_headers');
					pagetimeline.addOffender('caching_old_headers', url + ' - ' + headerName + ': ' + value);
					break;
			}
		}
		return ttl;
	}
};
