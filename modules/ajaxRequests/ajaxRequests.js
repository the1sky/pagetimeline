/**
 * Created by nant on 2014/7/13.
 */
exports.version = '0.1';

exports.module = function(pagetimeline,callback){
	var start = +new Date()
	pagetimeline.log( 'ajax requests...' );
	var requests = pagetimeline.core.requests;
	var _ = require('underscore');
	var keyName = 'ajaxRequests';
	var assertsInfo = {
		count:0,
		size:0,
		urls:[]
	}

	_.each(requests,function(value,key){
		var url = value.url;
		var responseBody = value.responseBody;
		var requestHeaders = responseBody['requestHeaders'];

		if( requestHeaders && ( requestHeaders[ 'X-Requested-With'] == 'XMLHttpRequest' ) ){
			var contentLen = 0;
			if( responseBody.headers['Content-Length'] ){
				contentLen = parseFloat( responseBody.headers['Content-Length'] );
			}else{
				contentLen = 0;
			}

			assertsInfo.count ++;
			assertsInfo.size += contentLen;
			assertsInfo.urls.push( url );
		}
	});

	if( assertsInfo.count ){
		pagetimeline.setMetric(keyName, '   count:' + assertsInfo.count + '  size:' + ( assertsInfo.size / 1024 ).toFixed(2) + 'KB'  );
		_.each( assertsInfo.urls,function(url){
			pagetimeline.addOffender(keyName, url );
		})
	}

	pagetimeline.log( 'ajax requests done in ' + (+new Date() - start ) + 'ms' );
	callback(false,' get ajax requests succ!');
}