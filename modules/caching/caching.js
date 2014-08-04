/**
 *
 * Created by nant on 2014/8/4.
 */

//todo, not support pc chrome now

exports.version = '0.1';

exports.run = function(pagetimeline,callback){
	callback( false, {message:"add module caching done!"});

	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam('timeout');

	var cacheRequstId = {};
	var cacheRequestBody = [];

	pagetimeline.setMetric('cachingNotSpecified'); // @desc number of responses with no caching header sent (no Cache-Control header)
	pagetimeline.setMetric('cachingTooShort'); // @desc number of responses with too short (less than a week) caching time
	pagetimeline.setMetric('cachingDisabled'); // @desc number of responses with caching disabled (max-age=0)
	pagetimeline.setMetric('oldCachingHeaders');

	browser.onRequestServedFromCache(function(res){
		cacheRequstId[res.requestId] = res.requestId;
	});

	browser.onResponseReceived(function(res){
		var requestId = res.requestId;
		if( cacheRequstId[requestId] ){
			cacheRequestBody.push( res.response );
		}
	})

	browser.onLoadEventFired(function(res){
		setTimeout(function(){
			var len = cacheRequestBody.length;
			for( var i=0; i < len; i++ ){
				var url = cacheRequestBody[i].url;
				var headers = cacheRequestBody[i].headers;
				var ttl = getCachingTime( url, headers )
				if (ttl === false) {
					pagetimeline.incrMetric('cachingNotSpecified');
					pagetimeline.addOffender('cachingNotSpecified', url);
				}
				else if (ttl === 0) {
					pagetimeline.incrMetric('cachingDisabled');
					pagetimeline.addOffender('cachingDisabled', url);
				}
				else if (ttl < 7 * 86400) {
					pagetimeline.incrMetric('cachingTooShort');
					pagetimeline.addOffender('cachingTooShort', url + ' cached for ' + ttl + ' s');
				}
			}
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
					pagetimeline.incrMetric('oldCachingHeaders'); // @desc number of responses with old, HTTP 1.0 caching headers (Expires and Pragma)
					pagetimeline.addOffender('oldCachingHeaders', url + ' - ' + headerName + ': ' + value);
					break;
			}
		}
		return ttl;
	}
}
