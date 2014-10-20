/**
 *
 * Created by nant on 2014/7/9.
 */

exports.version = '0.1';
exports.name = 'loadtimes';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add load time module!'} );

	pagetimeline.log( 'load time...' );
	var startTime = pagetimeline.model.startTime;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;
	var browser = pagetimeline.model.browser;

	var requestId_info = {};

	browser.onResponseReceived( function(res){
		var requestId = res['requestId'];
		var timestamp = res['timestamp'];
		var response = res.response;
		var url = response.url;
		if( !requestId_info[requestId] ){
			requestId_info[requestId] = {}
		}
		requestId_info[requestId] = {
			'url':url,
			'timestamp':timestamp,
			'responseBody':response
		};
	} );

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
		getStartTime( function(err, res){
			if( !err ){
				startTime = res.result.value['navigationStart'];
			}
			var start = +new Date();
			var loadTime = getSlowestTime() - startTime;
			pagetimeline.log( 'load time done in ' + (+new Date() - start ) + 'ms' );
			pagetimeline.setMetric( 'load_time', parseInt( loadTime ) );
		} );
	}

	function getSlowestTime(){
		var slowestTime = 0;
		for( var requestId in requestId_info ){
			var entry = requestId_info[requestId];
			var timestamp = entry['timestamp'];
			if( timestamp > slowestTime ){
				slowestTime = timestamp;
			}
		}
		return slowestTime * 1000;
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
