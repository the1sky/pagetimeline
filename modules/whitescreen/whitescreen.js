/**
 * Created by nant on 2014/7/9.
 */
exports.version = '0.1';
exports.name = 'whitescreen';

exports.run = function(pagetimeline, callback){
	var startTime = pagetimeline.model.startTime;
	var browser = pagetimeline.model.browser;

	function getFirstPaintTime(){
		var loadtimes = chrome.loadTimes();
		return loadtimes.firstPaintTime;
	}

	browser.Page.loadEventFired( function(res){
		var str = getFirstPaintTime.toString() + ';getFirstPaintTime()';
		browser.Runtime.evaluate( {expression:str, returnByValue:true}, function(err, res){
			if( !err ){
				var firstPaintTime = res.result['value'] * 1000;
				var whiteScreenTime = firstPaintTime - startTime;
				pagetimeline.setMetric( 'whiteScreenTime', parseInt( whiteScreenTime ) );
			}
		} )
	} );

	callback( false, {message:'add white screen module done!'} );
}
