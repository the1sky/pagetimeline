/**
 * Created by nant on 2014/7/12.
 */

exports.version = '0.1';
exports.name = 'page';

exports.run = function(pagetimeline, callback){
	pagetimeline.log( 'dom ready and onLoad ...' );
	var browser = pagetimeline.model.browser;
	var startTime = pagetimeline.model.startTime;

	browser.onDomContentEventFired(function(res){
		var domreadyTime = res.timestamp * 1000 - startTime;
		pagetimeline.setMetric( 'domreadyEvent', parseInt( domreadyTime ) );
	} );

	browser.onLoadEventFired(function(res){
		var onloadTime = res.timestamp * 1000 - startTime;
		pagetimeline.setMetric( 'onloadEvent', parseInt( onloadTime ) );
	} );
	callback( false, 'add dom ready onLoad event module done!' );
}

exports.name = 'page';
