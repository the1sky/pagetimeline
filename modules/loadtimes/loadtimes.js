/**
 *
 * Created by nant on 2014/7/9.
 */

exports.version = '0.1';

exports.module = function(pagetimeline,callback){
	var requests = pagetimeline.requests;
	var startTime = pagetimeline.startTime;

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

	var loadTime = getSlowestTime() - startTime;
	pagetimeline.setMetric('loadTime', loadTime );
	callback(false,{message:'get load time done!'});
}
