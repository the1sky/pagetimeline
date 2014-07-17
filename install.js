var browserScript = require( './libs/browserScript' );
var bs = new browserScript( null );
var AdmZip = require('adm-zip')
var cp = require('child_process')
var fs = require('fs')
var helper = require('./lib/timeline')
var http = require('http')
var kew = require('kew')
var ncp = require('ncp')
var npmconf = require('npmconf')
var mkdirp = require('mkdirp')
var path = require('path')
var rimraf = require('rimraf').sync
var url = require('url')
var util = require('util')
var which = require('which')

if( process.platform == 'linux' ){
	//auto install
	bs.installBrowser( function(err, res){
		console.log( err, res );
	} )
}else if( process.platform == 'win32'){
	//auto download
	var downloadUrl = 'http://fe.baidu.com/pagetimeline/tools/timeline-' + helper.version + '-'
	var originalPath = process.env.PATH

	var libPath = path.join(__dirname, 'lib')
	var pkgPath = path.join(libPath, 'timeline')
	var timelinePath = null
	var tmpPath = null
	var whichDeferred = kew.defer()
	which('timeline', whichDeferred.makeNodeResolver())
	whichDeferred.promise
		.then(function (path) {
			timelinePath = path

			// Horrible hack to avoid problems during global install. We check to see if
			// the file `which` found is our own bin script.
			// See: https://github.com/Obvious/phantomjs/issues/85
			if (/NPM_INSTALL_MARKER/.test(fs.readFileSync(timelinePath, 'utf8'))) {
				console.log('Looks like an `npm install -g`; unable to check for already installed version.')
				throw new Error('Global install')

			} else {
				var checkVersionDeferred = kew.defer()
				cp.execFile(timelinePath, ['--version'], checkVersionDeferred.makeNodeResolver())
				return checkVersionDeferred.promise
			}
		})
		.then(function (stdout) {
			var version = stdout.trim()
			if (helper.version == version) {
				writeLocationFile(timelinePath)
				console.log('PhantomJS is already installed at', timelinePath + '.')
				exit(0)

			} else {d
				console.log('PhantomJS detected, but wrong version', stdout.trim(), '@', timelinePath + '.')
				throw new Error('Wrong version')
			}
		})
		.fail(function (err) {
			// Trying to use a local file failed, so initiate download and install
			// steps instead.
			var npmconfDeferred = kew.defer()
			npmconf.load(npmconfDeferred.makeNodeResolver())
			return npmconfDeferred.promise
		})
		.then(function (conf) {
			tmpPath = findSuitableTempDirectory(conf)

			var fileName = downloadUrl.split('/').pop()
			var downloadedFile = path.join(tmpPath, fileName)

			// Start the install.
			if (!fs.existsSync(downloadedFile)) {
				console.log('Downloading', downloadUrl)
				console.log('Saving to', downloadedFile)
				return requestBinary(getRequestOptions(conf.get('proxy')), downloadedFile)
			} else {
				console.log('Download already available at', downloadedFile)
				return downloadedFile
			}
		})
		.then(function (downloadedFile) {
			return extractDownload(downloadedFile)
		})
		.then(function (extractedPath) {
			return copyIntoPlace(extractedPath, pkgPath)
		})
		.then(function () {
			var location = process.platform === 'win32' ?
				path.join(pkgPath, 'timeline.exe') :
				path.join(pkgPath, 'bin', 'timeline')
			var relativeLocation = path.relative(libPath, location)
			writeLocationFile(relativeLocation)
			console.log('Done. timeline binary available at', location)
			exit(0)
		})
		.fail(function (err) {
			console.error('timeline installation failed', err, err.stack)
			exit(1)
		})


	function writeLocationFile(location) {
		console.log('Writing location.js file')
		if (process.platform === 'win32') {
			location = location.replace(/\\/g, '\\\\')
		}
		fs.writeFileSync(path.join(libPath, 'location.js'),
				'module.exports.location.timeline = "' + location + '"')
	}


	function exit(code) {
		process.env.PATH = originalPath
		process.exit(code || 0)
	}


	function findSuitableTempDirectory(npmConf) {
		var now = Date.now()
		var candidateTmpDirs = [
				process.env.TMPDIR || process.env.TEMP || '/tmp',
			npmConf.get('tmp'),
			path.join(process.cwd(), 'tmp')
		]

		for (var i = 0; i < candidateTmpDirs.length; i++) {
			var candidatePath = path.join(candidateTmpDirs[i], 'timeline')

			try {
				mkdirp.sync(candidatePath, '0777')
				// Make double sure we have 0777 permissions; some operating systems
				// default umask does not allow write by default.
				fs.chmodSync(candidatePath, '0777')
				var testFile = path.join(candidatePath, now + '.tmp')
				fs.writeFileSync(testFile, 'test')
				fs.unlinkSync(testFile)
				return candidatePath
			} catch (e) {
				console.log(candidatePath, 'is not writable:', e.message)
			}
		}

		console.error('Can not find a writable tmp directory, please report issue ' +
			'on https://github.com/fex/pagetimeline')
		exit(1)
	}


	function getRequestOptions(proxyUrl) {
		if (proxyUrl) {
			var options = url.parse(proxyUrl)
			options.path = downloadUrl
			options.headers = { Host: url.parse(downloadUrl).host }
			// If going through proxy, spoof the User-Agent, since may commerical proxies block blank or unknown agents in headers
			options.headers['User-Agent'] = 'curl/7.21.4 (universal-apple-darwin11.0) libcurl/7.21.4 OpenSSL/0.9.8r zlib/1.2.5'
			// Turn basic authorization into proxy-authorization.
			if (options.auth) {
				options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(options.auth).toString('base64')
				delete options.auth
			}

			return options
		} else {
			return url.parse(downloadUrl)
		}
	}


	function requestBinary(requestOptions, filePath) {
		var deferred = kew.defer()

		var count = 0
		var notifiedCount = 0
		var writePath = filePath + '-download-' + Date.now()
		var outFile = fs.openSync(writePath, 'w')

		var client = http.get(requestOptions, function (response) {
			var status = response.statusCode
			console.log('Receiving...')

			if (status === 200) {
				response.addListener('data',   function (data) {
					fs.writeSync(outFile, data, 0, data.length, null)
					count += data.length
					if ((count - notifiedCount) > 800000) {
						console.log('Received ' + Math.floor(count / 1024) + 'K...')
						notifiedCount = count
					}
				})

				response.addListener('end',   function () {
					console.log('Received ' + Math.floor(count / 1024) + 'K total.')
					fs.closeSync(outFile)
					fs.renameSync(writePath, filePath)
					deferred.resolve(filePath)
				})

			} else {
				client.abort()
				console.error('Error requesting archive')
				deferred.reject(new Error('Error with http request: ' + util.inspect(response.headers)))
			}
		})

		return deferred.promise
	}


	function extractDownload(filePath) {
		var deferred = kew.defer()
		// extract to a unique directory in case multiple processes are
		// installing and extracting at once
		var extractedPath = filePath + '-extract-' + Date.now()
		var options = {cwd: extractedPath}

		mkdirp.sync(extractedPath, '0777')
		// Make double sure we have 0777 permissions; some operating systems
		// default umask does not allow write by default.
		fs.chmodSync(extractedPath, '0777')

		if (filePath.substr(-4) === '.zip') {
			console.log('Extracting zip contents')

			try {
				var zip = new AdmZip(filePath)
				zip.extractAllTo(extractedPath, true)
				deferred.resolve(extractedPath)
			} catch (err) {
				console.error('Error extracting archive')
				deferred.reject(err)
			}

		} else {
			console.log('Extracting tar contents (via spawned process)')
			cp.execFile('tar', ['jxf', filePath], options, function (err, stdout, stderr) {
				if (err) {
					console.error('Error extracting archive')
					deferred.reject(err)
				} else {
					deferred.resolve(extractedPath)
				}
			})
		}
		return deferred.promise
	}


	function copyIntoPlace(extractedPath, targetPath) {
		rimraf(targetPath)

		var deferred = kew.defer()
		// Look for the extracted directory, so we can rename it.
		var files = fs.readdirSync(extractedPath)
		for (var i = 0; i < files.length; i++) {
			var file = path.join(extractedPath, files[i])
			if (fs.statSync(file).isDirectory() && file.indexOf(helper.version) != -1) {
				console.log('Copying extracted folder', file, '->', targetPath)
				ncp(file, targetPath, deferred.makeNodeResolver())
				break
			}
		}

		// Cleanup extracted directory after it's been copied
		return deferred.promise.then(function() {
			try {
				return rimraf(extractedPath)
			} catch (e) {
				console.warn('Unable to remove temporary files at "' + extractedPath +
					'", see https://github.com/fex/pagetimeline.')
			}
		});
	}
}
