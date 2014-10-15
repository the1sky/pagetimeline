/**
 * Created by nant on 2014/7/9.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add white screen module done!'} );

	var startTime = pagetimeline.model.startTime;
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );

	function getFirstPaintTime(){
		var loadtimes = chrome.loadTimes();
		return loadtimes.firstPaintTime;
	}

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			getStartTime( function(err, tmpRes){
				if( !err )  startTime = tmpRes.result.value['navigationStart'];

				var str = getFirstPaintTime.toString() + ';getFirstPaintTime()';
				browser.evaluate( str, function(err, res){
					if( !err ){
						var firstPaintTime = res.result['value'] * 1000;
						var whiteScreenTime = firstPaintTime - startTime;
						pagetimeline.setMetric( 'white_screen_time', parseInt( whiteScreenTime ) );
					}
				} );
			} );
		},timeout );
	} );

	function getTiming(){
		return window.performance.timing;
	}

	function getStartTime(callback){
		var script = getTiming.toString() + ';getTiming()';
		browser.evaluate( script, function(err, res){
			callback( err, res );
		} );
	}
}
