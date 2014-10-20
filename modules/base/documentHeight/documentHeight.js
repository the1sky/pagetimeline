/**
 * Created by nant on 2014/8/4.
 */

exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add document height module done!'} );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var domreadytimeout = pagetimeline.model.domreadyTimeout;

	browser.onLoadEventFired( function(res){
		setTimeout( function(){
			calculate();
		}, timeout );
	} )

	browser.onDomContentEventFired( function(res){
		setTimeout( function(){
			if( !pagetimeline.model.afteronload ){
				calculate();
			}
		}, domreadytimeout );
	} )

	function calculate(){
		var script = getDocumentHeight.toString() + ';getDocumentHeight()';
		browser.evaluate( script, function(err, res){
			if( !err ){
				pagetimeline.setMetric( 'document_height', res.result.value );
			}
		} )
	}

	function getDocumentHeight(){
		var doc = document, body = doc.body, docelem = doc.documentElement;
		return Math.max( body.scrollHeight, body.offsetHeight, docelem.clientHeight, docelem.scrollHeight, docelem.offsetHeight );
	}
}