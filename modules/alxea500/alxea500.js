/**
 * Created by nant on 9/11/2014.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
    pagetimeline.log( 'alxea 500...' );
	callback( false, {message:'add dynamic crawl page module done!'} );

	var path = require('path');
	var fs = require( 'fs' );
	var _ = require( 'underscore' );

	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var url = pagetimeline.model.originalUrl;
	var runstep = pagetimeline.model.runstep;
	var uid = pagetimeline.model.uid;

	var urlTemplate = require( 'url-template' );
	url = urlTemplate.parse( url ).expand( {
		page:runstep
	} );
	pagetimeline.model.url = url;

	browser.onLoadEventFired( function(res){
		setTimeout( function(){
			var script = getUrl.toString() + ';getUrl()';
			var harName = path.resolve( './', 'alxea500' );
			browser.evaluate( script, function(err,res){
				if( !err && res && res.result && res.result.value ){
					var urls = res.result.value;
					_.forEach( urls, function(url,index){
						url = url.substr(6, url.length - 6 - 5 );
						fs.appendFileSync( harName, url + '\n\r' );
					});
				}
                pagetimeline.finishModule();
			});
		}, timeout );
	} );

	function getUrl(){
		var hrefs =  [];
		$('.icon_top_view' ).each(function(index){
			"use strict";
			hrefs.push( $(this ).attr('href'));
		});
		return hrefs;
	}
}