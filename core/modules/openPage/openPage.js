/**
 * Created by nant on 2014/7/18.
 */

exports.run = function(pagetimeline, callback){
	pagetimeline.log( 'open page ...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' ) + 1000;
	var url = pagetimeline.model.url;

	browser.Page.loadEventFired( function(res){
		setTimeout( function(callback){
			callback( false, {message:'load page done!'} );
		}, timeout, callback );
	} );

	browser.Page.navigate( {url:url}, function(err, res){
		if( !err ){
		}else{
			callback( true, {message:'page open fail!'} );
		}
	} );
}

exports.name = 'openPage';
