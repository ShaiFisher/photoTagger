const fs = require('fs');
const clipboardy = require('clipboardy');
const path = require('path');
const Jimp = require('jimp');
const interval = require('interval');

const COMMAND_PREFIX = 'PhotoTagger: ';
const SAFE_WORD_LENGTH = 20;


if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/directory");
    process.exit(-1);
}
var runPath = process.argv[2];

var clipData = '';

var settings = {
	safeWord: generateSafeWord()
};
//console.log('settings:', settings);

console.log(process.argv);
if (process.argv.indexOf('-skipscan') < 0) {
	buildPhotosFile(runPath);
}

console.log('Listening...');
listen();



////////////////////////////////////////////////////////////

function generateSafeWord() {
	var chars = 'qwertyuiopasdfghjklzxcvbnm1234567890[];,.';
	var key = '';
	for (var i=0; i<SAFE_WORD_LENGTH; i++) {
		var rand = Math.floor(Math.random() * chars.length);
		key += chars[rand];
	}
	return key;
};

function buildPhotosFile(path) {
	getPhotosList(path, function(photosList) {
		//console.log('photosList:\n' + photosList);
		console.log('writing file');
		var photosJsonCode = 'var photos = \n' + JSON.stringify(photosList) + ';\n';
		var settingsJsonCode = 'var settings = ' + JSON.stringify(settings) + ';';
		fs.writeFileSync('photos.js', settingsJsonCode + photosJsonCode);
	});
}

function getPhotosList(path, callback) {
	console.log('Reading photos');
	var photosList = [];
	
	var folders = [path];
	for (var j=0; j<folders.length; j++) {
		var folder = folders[j];
		console.log('  ' + folder);
		var items = fs.readdirSync(folder);
	 
	    for (var i=0; i<items.length; i++) {
			var fileName = items[i]
			var filePath = folder + '/' + fileName;
	        
	        if (isFolder(filePath)) {
	        	//console.log('isFolder');
	        	folders.push(filePath);
	        } else if (isImage(fileName)) {
	        	//console.log(filePath);
	        	photosList.push(new Photo(null, filePath));
	        }
	    };
	}
	callback(photosList);
	return photosList;
}

function isFolder(filePath) {
	const stats = fs.statSync(filePath);
	//console.log('stats:', stats);
	return stats.isDirectory();
}

function isImage(filePath) {
	var ext = path.extname(filePath).toLowerCase();
	var isImage = (ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.gif');
	return isImage;
}

function isImageInScope(filePath) {
	if (!isImage(filePath)) {
		console.log('not an image');
	}
	if (!isInRunPath(filePath)) {
		console.log('not in run path');
	}
	if (hasWildcards(filePath)) {
		console.log('has wild cards');
	}
	return (isImage(filePath) && isInRunPath(filePath) && !hasWildcards(filePath));
}

function listen() {
	try {
		newClipData = clipboardy.readSync();
	}
	catch (err) {
		console.log('error read clipboard:', err);
	}
		
	if (newClipData != clipData) {
		//console.log('newClipData:', newClipData);
		if (newClipData.startsWith(COMMAND_PREFIX)) {
			var expectedPrefix = COMMAND_PREFIX + settings.safeWord + ': ';
			if (newClipData.startsWith(expectedPrefix)) {
				var command = newClipData.substring(expectedPrefix.length);
				console.log('\ncommand:', command);
				if (command.startsWith('applyTags: ')) {
					var photoJson = command.substring(11);
					var photo = new Photo(JSON.parse(photoJson));
					checkScopeAndRun(photo.filePath, function() {
						photo.applyTags();
					});
				} else if (command.startsWith('rotateRight: ')) {
					var filePath = command.substring(13);
					checkScopeAndRun(filePath, function() {
						rotateRight(filePath);
					});
				} else if (command.startsWith('rotateLeft: ')) {
					var filePath = command.substring(12);
					checkScopeAndRun(filePath, function() {
						rotateLeft(filePath);
					});
				} else if (command.startsWith('delete: ')) {
					var filePath = command.substring(8);
					checkScopeAndRun(filePath, function() {
						deleteFile(filePath);
					});
				} else {
					console.log('unknown command');
				}
			} else {
				console.log('wrong key, refresh the page.');
			}
		}
		clipData = newClipData;
	}

	setTimeout(listen, interval({ seconds: 2 }));
}

function checkScopeAndRun(filePath, func) {
	if (isImageInScope(filePath)) {
		func();
	} else {
		console.log('file not in scope');
	}
}

function renameFile(path, fileName, newFileName) {
	var callback = function(ret) {
		console.log('renamed.');
	};
	var oldFilePath = path + '/' + fileName;
	var newFilePath = path + '/' + newFileName;
	fs.rename(oldFilePath, newFilePath, callback);
}

function deleteFile(filePath) {
	console.log('delete:', filePath);
	fs.unlinkSync(filePath);
}

function isInRunPath(filePath) {
	//console.log('isInRunPath: checking:', runPath, filePath);

	if (path.isAbsolute(filePath)) {
		//console.log('isAbsolute');
		//return false;
	}

	var folders = filePath.split('/');
	//console.log('folders:', folders);
	for (var i=0; i<folders.length; i++) {
		if (folders[i] == '..' ) {
			console.log('folders contains ..');
			return false;
		}
	}

	var relative = path.relative(runPath, filePath);
	//console.log('relative:', relative);
	return (!relative.startsWith('..') && !relative.startsWith('/'));
}

function hasWildcards(filePath) {
	return (filePath.includes('*') || filePath.includes('?'));
}

function getExtension(fileName) {
	// var path = require('path')
	// return path.extname('index.html')
	return fileName.split('.').pop();
}

function rotate(filePath, degree) {
	Jimp.read(filePath).then(function (photo) {
		console.log('rotating', filePath, degree);
	  photo
	    .rotate(degree)
	    .write(filePath); // save
	})
	.catch(function(err) {
		console.log('err:', err);
	});
}

function rotateRight(filePath) {
	console.log('rotateRight:', filePath);
	rotate(filePath, 270);
}

function rotateLeft(filePath) {
	console.log('rotateLeft:', filePath);
	rotate(filePath, 90);
}


function Photo(photo, filePath) {
	photo = photo || {
		path: 		path.dirname(filePath),
		fileName: 	path.basename(filePath),
		filePath: 	filePath
	};

	if (!photo.filePath) {
		if (photo.path) {
			photo.filePath = photo.path + '/' + photo.fileName
		} else {
			photo.filePath = photo.fileName
		}
	}

	photo.applyTags =  function() {
		console.log('applyTags:', photo.path, photo.fileName, photo.tags);

		// get current tags
		var ctBegin = photo.fileName.indexOf('[');
		var ctEnd = photo.fileName.indexOf(']') + 1;
		var oldTagsStr = (ctBegin > 0) ? photo.fileName.substring(ctBegin, ctEnd) : '';
		var newTagsStr = (photo.tags && photo.tags.length) ? '[' + photo.tags + ']' : '';
		//console.log('tags: "' + oldTagsStr + '" => "' + newTagsStr + '"');


		var newFileName;
		if (!oldTagsStr) {
			var ext = path.extname(photo.fileName);
			var base = path.basename(photo.fileName, ext);
			//console.log('new tags: base: "' + base + '", ext: "' + ext + '"');
			if (newTagsStr) {
				newTagsStr = ' ' + newTagsStr;
			}
			newFileName = base + newTagsStr + ext;
		} else {
			newFileName = photo.fileName.replace(oldTagsStr, newTagsStr);
		}

		
		if (newFileName != photo.fileName) {
			console.log('newFileName:', newFileName);
			renameFile(photo.path, photo.fileName, newFileName);
		} else {
			console.log('No change');
		}
	};

	photo.rotateRight = function() {
		console.log('rotateRight:', photo.filePath);
		rotateRight(photo.filePath);
	};

	return photo;
}