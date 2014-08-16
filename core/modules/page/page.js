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
	var runstep = pagetimeline.model.runstep;

	browser.onDomContentEventFired( function(res){
		getStartTime( function(err, tmpRes){
			if( !err ) startTime = tmpRes.result.value['navigationStart'];

			var domreadyTime = res.timestamp * 1000 - startTime;
			pagetimeline.setMetric( 'domreadyEvent', parseInt( domreadyTime ) );
		} );
	} );

	browser.onLoadEventFired( function(res){
		getStartTime( function(err, tmpRes){
			if( !err ) startTime = tmpRes.result.value['navigationStart'];

			var onloadTime = res.timestamp * 1000 - startTime;
			pagetimeline.setMetric( 'onloadEvent', parseInt( onloadTime ) );

			setTimeout( function(callback){
				callback( false, {message:'analyze page done!'} );
			}, timeout, callback );
		} );
	} );

	if( runstep == 1 ){
		browser.setCacheDisabled( true, function(err, res){
		} );
	}else{
		browser.setCacheDisabled( false, function(err, res){
		} );
	}

	browser.navigate( url, function(err, res){
		if( err ){
			callback( true, {message:'page open fail!'} );
		}
	} );

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

exports.name = 'page';
