/**
 * Created by nant on 2014/7/9.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	var startTime = pagetimeline.model.startTime;
	var browser = pagetimeline.model.browser;

	function getFirstPaintTime(){
		var loadtimes = chrome.loadTimes();
		return loadtimes.firstPaintTime;
	}

	browser.Page.loadEventFired( function(res){
		var str = getFirstPaintTime.toString() + ';getFirstPaintTime()';
		browser.evaluate( str,function(err,res){
			if( !err ){
				var firstPaintTime = res.result['value'] * 1000;
				var whiteScreenTime = firstPaintTime - startTime;
				pagetimeline.setMetric( 'white_screen_time', parseInt( whiteScreenTime ) );
			}
		} )
	} );

	callback( false, {message:'add white screen module done!'} );
}
