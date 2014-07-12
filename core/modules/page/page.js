/**
 * Created by nant on 2014/7/12.
 */

exports.run = function(pagetimeline,callback){
	var startTime = 0;

	var enablePage = function(pagetimeline, callback){
		var browser = pagetimeline.core.browser;
		browser.send( 'Page.enable', {}, function(err, response){
			callback( err, response );
		} );
	};

	var pageNavigate = function(pagetimeline,callback){
		startTime = +new Date();
		var browser = pagetimeline.core.browser;
		browser.send( 'Page.navigate', {'url':pagetimeline.url}, function(err, response){
			if( !err ){
				pagetimeline.core.startTime = startTime;
				exports.output = startTime;
				callback(false,{message:'page open success!'});
			}else{
				callback(true,{message:'page open fail!'});
			}
		} );
	}

	var addDomreadyEventListener = function(pagetimeline,callback){
		var browser = pagetimeline.core.browser;
		browser.once('Page.domContentEventFired',function(data){
			var domreadyTime = data.timestamp * 1000 - startTime;
			pagetimeline.setMetric( 'domreadyEvent', parseInt( domreadyTime ) );
		});
		callback(false, 'add donm ready event');
	}

	var addOnloadEventListener = function(pagetimeline,callback){
		var browser = pagetimeline.core.browser;
		browser.once('Page.loadEventFired',function(data){
			var onloadTime = data.timestamp * 1000 - startTime;
			pagetimeline.setMetric( 'onloadEvent', parseInt( onloadTime ) );
			setTimeout( function(callback){
				callback(false,{message:'load page done!'});
			},pagetimeline.getParam('timeout'),callback );
		});
	}

	var async = require('async');
	async.series([
		async.apply( enablePage, pagetimeline ),
		async.apply( pageNavigate, pagetimeline ),
		async.apply( addDomreadyEventListener, pagetimeline ),
		async.apply( addOnloadEventListener, pagetimeline )
		],function(err,result){
		callback(err,result);
	});
}

exports.name = 'page';
exports.after = 'network,runtime,timeline';
exports.output = null;