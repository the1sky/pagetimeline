/**
 * Created by nant on 2014/8/28.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add iframes module done!'} );
	pagetimeline.log( 'iframes...' );

	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;

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
		browser.evaluate( '$("iframe").length', function(err, res){
			if( res && res.result ){
				pagetimeline.incrMetric( 'iframe_count', res.result.value );
			}else{
				pagetimeline.setMetric( 'iframe_count', 0 );
			}
		} );
	}
}