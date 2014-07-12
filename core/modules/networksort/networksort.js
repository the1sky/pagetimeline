/**
 * Created by nant on 2014/7/12.
 */

exports.run = function(pagetimeline,callback){
	var requests = pagetimeline.core.requests;
	var requestInfoResult = {};
	for( var requestId in requests ){
		var requestInfo = requests[requestId];
		var url = requestInfo['url'];
		var timestamp = requestInfo['timestamp'];
		if( timestamp && !requestInfoResult[url] ){
			requestInfoResult[url] = timestamp;
		}
	}
	pagetimeline.core.requests = requestInfoResult;
	callback(false,{message:'network url sort success!'});
}

exports.name = 'networksort';
exports.after = 'page';
exports.output = null;
