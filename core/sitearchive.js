/**
 * Created by nant on 11/5/2014.
 */
var http = require( 'http' );

var saver = function(){
	this.config = {
		"postTo":"sitearchive.duapp.com",
		"postPort":80
	}
	return this;
}

/**
 * 发送到BAE
 * @param jsonStrData
 */
saver.prototype.upload = function(jsonStrData, callback){
	if( typeof callback !== 'function' ){
		callback = function(res){};
	}
	var options = {
		hostname:this.config.postTo,
		port:this.config.postPort,
		path:'/bae/data',
		method:'POST',

		headers:{
			"Content-Type":"application/json",
			'Content-Length':Buffer.byteLength( jsonStrData )
		}
	};
	var req = http.request( options, function(res){
		res.setEncoding( 'utf8' );
		res.on( 'data', function(chunk){
		} );
		res.on( 'end', function(res){
			callback( 'post date to sitearchive.baidu.com done!' );
		} );
	} );
	req.on( 'error', function(e){
		callback( e );
	} );

	// write data to request body
	req.write( jsonStrData );
	req.end();
}

module.exports = saver;