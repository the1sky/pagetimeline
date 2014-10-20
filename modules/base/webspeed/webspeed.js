/**
 * Created by nant on 2014/7/9.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'webspeed...' );
	var start = +new Date();
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			if( !pagetimeline.model.afteronload ){
				calculate();
			}
		}, domreadytimeout );
	} );

	browser.onLoadEventFired( function(res){
		setTimeout( function(){
			calculate();
		}, timeout );
	} )

	callback( false, 'add webspeed module done!' );

	function calculate(){
		var str = getWebspeed.toString() + ';getWebspeed()';
		browser.evaluate( str, function(err, res){
			if( !err && res.result.value ){
				var speedData = res.result.value;
				var fields = speedData.fields
				pagetimeline.log( 'webspeed done in ' + (+new Date() - start ) + 'ms' );
				pagetimeline.setMetric( 'webspeed', fields );
				for( var key in fields ){
					pagetimeline.addOffender( 'webspeed', key + ":" + fields[key] );
				}
			}
		} )
	}

	/**
	 *  baidu webspeed performance data,see:http://webspeed.baidu.com
	 *
	 * @returns {{}}
	 */
	function getWebspeed(){
		var result = {};
		if( alog && alog.tracker( 'speed' ) ){
			var speedInfo = alog.tracker( 'speed' );
			var name = speedInfo.name;
			var fields = speedInfo.fields;
			result['name'] = name;
			result['fields'] = {};
			for( var key in fields ){
				if( key != 'options' && key != 'protocolParameter' ){
					var fromStartTime = alog.timestamp( +new Date( fields[key] ) );
					result['fields'][key] = fromStartTime;
				}
			}
		}
		return result;
	}
}
