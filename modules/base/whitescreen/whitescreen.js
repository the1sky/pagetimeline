/**
 * Created by nant on 2014/7/9.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
    pagetimeline.log('white screen...');
	callback( false, {message:'add white screen module done!'} );

	var startTime = pagetimeline.model.startTime;
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;

	function getFirstPaintTime(){
		var loadtimes = chrome.loadTimes();
		return loadtimes.firstPaintTime;
	}

	browser.onLoadEventFired( function(res){
		setTimeout( function(){
			calculate();
		}, timeout );
	} );

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			if( !pagetimeline.model.afteronload ){
				calculate();
			}
		}, domreadytimeout );
	} );

	function calculate(){
		getStartTime( function(err, tmpRes){
			if( !err && tmpRes && tmpRes.result )  startTime = tmpRes.result.value['navigationStart'];

			var str = getFirstPaintTime.toString() + ';getFirstPaintTime()';
			browser.evaluate( str, function(err, res){
				if( !err && res && res.result ){
					var firstPaintTime = res.result['value'] * 1000;
					var whiteScreenTime = firstPaintTime - startTime;
					pagetimeline.setMetric( 'white_screen_time', parseInt( whiteScreenTime ) );
				}
                pagetimeline.finishModule();
			} );
		} );
	}

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
