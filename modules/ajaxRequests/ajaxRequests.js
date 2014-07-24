/**
 * Created by nant on 2014/7/13.
 */
exports.version = '0.1';
exports.name = 'ajaxRequest';

exports.run = function(pagetimeline,callback){
	pagetimeline.log( 'ajax requests...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam('timeout');
	var requestId_info = {};

	browser.Network.responseReceived(function(res){
		var requestId = res['requestId'];
		var timestamp = res['timestamp'];
		var response = res.response;
		var url = response.url;
		if( !requestId_info[requestId] ){
			requestId_info[requestId] = {}
		}
		requestId_info[requestId] = {
			'url':url,
			'timestamp':timestamp,
			'responseBody':response
		};
	});

	browser.Page.loadEventFired(function(res){
		setTimeout(function(){
			var start = +new Date()
			var _ = require('underscore');
			var keyName = 'ajaxRequests';
			var assertsInfo = {
				count:0,
				size:0,
				urls:[]
			}

			_.each(requestId_info,function(value,key){
				var url = value.url;
				var responseBody = value.responseBody;
				var requestHeaders = responseBody ? responseBody['requestHeaders'] : null;

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
		},timeout);
	});
	callback(false,{message:'add ajax request'});
}