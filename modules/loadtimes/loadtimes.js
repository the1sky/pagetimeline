/**
 *
 * Created by nant on 2014/7/9.
 */

exports.version = '0.1';

exports.module = function(pagetimeline,callback){
	var requests = getRequestTimeByUrl( pagetimeline.core.requests );
	var startTime = pagetimeline.core.startTime;

	function getSlowestTime(){
		var slowestTime = 0;
		for( var url in requests ){
			var timestamp = requests[url];
			if( timestamp > slowestTime ){
				slowestTime = timestamp;
			}
		}
		return slowestTime * 1000;
	}

	function getRequestTimeByUrl(requests){
		var requestsByUrl = {};
		for( var requestId in requests ){
			var requestInfo = requests[requestId];
			var url = requestInfo['url'];
			var timestamp = requestInfo['timestamp'];
			if( timestamp && !requestsByUrl[url] ){
				requestsByUrl[url] = timestamp;
			}
		}
		return requestsByUrl;
	}

	var loadTime = getSlowestTime() - startTime;
	pagetimeline.setMetric('loadTime', parseInt( loadTime ) );
	callback(false,{message:'get load time done!'});
}
