/**
 * Created by nant on 2014/7/9.
 */
exports.version = '0.1';

exports.module = function(pagetimeline,callback) {
	pagetimeline.log('webspeed...');
	var browser = pagetimeline.browser;
	with(browser){
		var str = getWebspeed.toString() + ';getWebspeed()';
		send( 'Runtime.evaluate', {'expression':str, returnByValue:true}, function(err, result){
			if( !err ){
				var speedData = result.result.value;
				var name = speedData.name;
				var fields = speedData.fields;
				for( var key in fields ){
					pagetimeline.setMetric(  'webspeed_' + key, fields[key] );
				}
				callback(false, 'get webspeed data done!');
			}else{
				callback(err,result);
			}
		})
	}

	function getWebspeed(){
		var result = {};
		if( alog && alog.tracker('speed') ){
			var speedInfo = alog.tracker('speed');
			var name = speedInfo.name;
			var fields = speedInfo.fields;
			result['name'] = name;
			result['fields'] = {};
			for( var key in fields ){
				if( key !='options' &&  key != 'protocolParameter'){
					console.log( key, fields[key], fields );
					var fromStartTime = alog.timestamp( +new Date(fields[key]) );
					result['fields'][key] = fromStartTime;
				}
			}
		}
		return result;
	}
}
