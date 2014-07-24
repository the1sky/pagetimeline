/**
 * Created by nant on 2014/7/9.
 */

exports.version = '1.0'

exports.run = function(pagetimeline, callback){
	var start = +new Date();
	var browser = pagetimeline.model.browser;
	var str = getTiming.toString() + ';getTiming()';
	pagetimeline.log( 'timing...' );
	browser.Page.loadEventFired( function(res){
		browser.Runtime.evaluate( {expression:str, returnByValue:true}, function(err, data){
			if( !err ){
				var timing = data.result.value;
				pagetimeline.log( 'timing done in ' + (+new Date() - start ) + 'ms' );
				pagetimeline.setMetric( 'timing', timing );
				for( var timingKey in timing ){
					pagetimeline.addOffender( 'timing', timingKey + ':' + timing[timingKey] );
				}
			}
		} );

	} );

	function getTiming(){
		return window.performance.timing;
	}

	callback( false, {message:'add timing module done!'} );
}

exports.name = 'timing'