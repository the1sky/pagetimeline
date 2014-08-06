/**
 * Created by nant on 2014/8/4.
 */

//todo, console message now, maybe others

exports.version = '0.1';
exports.name = 'jserror';

exports.module = function(pagetimeline, callback){
	var browser = pagetimeline.model.browser;

	browser.Console.messageAdded( function(res){
		var msg = res.message;
		if( msg && msg.level == 'error' && msg.stackTrace ){
			var trace = formatTrace( msg.stackTrace );
			pagetimeline.incrMetric( 'js_errors' );
			pagetimeline.addOffender( 'js_errors', msg.text + ' - ' + trace.join( ' / ' ) );
		}
	} );

	callback( false, 'add devices module done!' );

	function formatTrace(trace){
		var ret = [];
		if( Array.isArray( trace ) ){
			trace.forEach( function(entry){
				ret.push( (entry.function ? entry.function + '(): ' : 'unknown fn: ') + (entry.sourceURL || entry.file) + ' @ ' + entry.line );
			} );
		}
		return ret;
	}
}