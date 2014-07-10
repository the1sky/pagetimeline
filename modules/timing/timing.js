/**
 * Created by nant on 2014/7/9.
 */

exports.version = '1.0'

exports.module = function(pagetimeline,callback){
	pagetimeline.log('timing:' + pagetimeline.startTime)
	var browser = pagetimeline.browser;
	with( browser ){
		var str = getTiming.toString() + ';getTiming()';
		send( 'Runtime.evaluate', {'expression':str, returnByValue:true}, function(err, data){
			if( !err ){
				var timing = data.result.value;
				pagetimeline.setMetric('timing', timing );
				for( var timingKey in timing ){
					pagetimeline.addOffender('timing', timingKey + ':' + timing[timingKey] );
				}
				callback(false,{message:'get timing done!'});
			}else{

				callback(err,data);
			}
		} );
	}
	function getTiming(){
		return window.performance.timing;
	}
}