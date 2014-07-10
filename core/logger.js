/**
 * Simple logger (using both file and console)
 */
module.exports = function(logFile, params) {
	var colors = require('ansicolors'),
		styles = require('ansistyles'),
		fs = require('fs'),
		path = require('path'),
		stderr = process.stderr,
		beVerbose = params.beVerbose === true,
		beSilent = params.beSilent === true,
		stream;

	if (logFile !== '') {
		// use an absolute path
		logFile = path.resolve(logFile);
		log("Logging to " + logFile);

		// set up a stream to be used for logging
		stream = fs.open(logFile, 'w');
	}

	function echo(msg) {
		if (!beSilent) {
			console.log(msg);
		}
	}

	function log(msg) {
		var ts = (new Date()).toJSON().substr(11, 12);

		// format a message
		msg = (typeof msg === 'object') ? JSON.stringify(msg) : msg.toString().trim();

		// log to the console (--verbose)
		if (beVerbose) {
			var consoleMsg = msg;

			// error!
			if (/!$/.test(consoleMsg) || /Error:/.test(consoleMsg)) {
				consoleMsg = colors.brightRed(styles.bright(consoleMsg));
			}
			// label: message
			else if (/^(.*): /.test(consoleMsg)) {
				var idx = consoleMsg.indexOf(': ') + 1;
				consoleMsg = colors.brightGreen(consoleMsg.substr(0, idx)) + colors.brightBlack(consoleMsg.substr(idx));
			}
			// the rest
			else {
				consoleMsg = colors.brightBlack(consoleMsg);
			}

			if (!beSilent) {
				stderr.write(ts + ' ' + consoleMsg + '\r\n');
			}
		}

		// log to the file (--log)
		if (stream) {
			stream.writeLine(ts + ': ' + msg);
			stream.flush();
		}
	}

	// public API
	return {
		echo: echo,
		log: log
	};
};
