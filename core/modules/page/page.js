/**
 * Created by nant on 2014/7/12.
 */

exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'dom ready and onLoad, and open page ...' );

	var browser = pagetimeline.model.browser;
	var startTime = pagetimeline.model.startTime;
	var timeout = pagetimeline.getParam( 'timeout' ) + 1000;
	var url = pagetimeline.model.url;

	browser.onDomContentEventFired(function(res){
		var domreadyTime = res.timestamp * 1000 - startTime;
		pagetimeline.setMetric( 'domreadyEvent', parseInt( domreadyTime ) );
	} );

	browser.onLoadEventFired(function(res){
		var onloadTime = res.timestamp * 1000 - startTime;
		pagetimeline.setMetric( 'onloadEvent', parseInt( onloadTime ) );

		setTimeout( function(callback){
			callback( false, {message:'analyze page done!'} );
		}, timeout, callback );
	} );

	browser.navigate( url, function(err, res){
		if( err ){
			callback( true, {message:'page open fail!'} );
		}
	} );
}

exports.name = 'page';
