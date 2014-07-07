/**
 * Created by nant on 2014/7/7.
 */

var os_utils = require('os-utils');
exports.scriptName = {
	'run':'',
	'close':''
};

if( os_utils.platform() == 'win32'){
	exports.scriptName.run = 'runChrome.bat';
	exports.scriptName.close = 'closeChrome.bat';
}else{
	exports.scriptName.run = 'runChrome.sh';
	exports.scriptName.close = 'closeChrome.sh';
}

