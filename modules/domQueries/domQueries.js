/**
 * Created by nant on 2014/8/5.
 */

exports.version = '0.1';
exports.module = function(pagetimeline,callback){
    pagetimeline.log( 'dom queries...' );
	callback( false, {message:'add dom queries module done!'} );
    pagetimeline.finishModule();
}