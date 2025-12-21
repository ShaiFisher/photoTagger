const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const express = require('express');
const cors = require('cors');


if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " path/to/directory");
    process.exit(-1);
}
var runPath = process.argv[2];

const PORT = 3000;

console.log(process.argv);
if (process.argv.indexOf('-skipscan') < 0) {
	buildPhotosFile(runPath);
}

startServer();



////////////////////////////////////////////////////////////

function buildPhotosFile(path) {
	getPhotosList(path, function(photosList) {
		//console.log('photosList:\n' + photosList);
		console.log('writing file');
		var photosJsonCode = 'var photos = \n' + JSON.stringify(photosList) + ';\n';
		fs.writeFileSync('photos.js', photosJsonCode);
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

function startServer() {
	const app = express();
	
	app.use(cors());
	app.use(express.json());
	app.use(express.static(__dirname));
	
	// Serve photos from the runPath directory
	console.log('Serving photos from:', runPath);
	app.use('/photos', express.static(path.resolve(runPath)));
	
	app.post('/command', (req, res) => {
		try {
			const { command } = req.body;
			if (!command) {
				return res.status(400).json({ error: 'Command is required' });
			}
			
			handleCommand(command);
			res.json({ success: true });
		} catch (err) {
			console.error('Error handling command:', err);
			res.status(500).json({ error: err.message });
		}
	});
	
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
		console.log(`Open http://localhost:${PORT}/photos.html in your browser`);
	});
}

function handleCommand(command) {
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
}

function checkScopeAndRun(filePath, func) {
	console.log('Checking scope for:', filePath);
	if (isImageInScope(filePath)) {
		console.log('✓ File is in scope, executing command');
		func();
	} else {
		console.log('✗ BLOCKED: File not in scope, command rejected');
	}
}

function renameFile(path, fileName, newFileName) {
	const oldFilePath = path + '/' + fileName;
	const newFilePath = path + '/' + newFileName;
	
	// Verify both old and new paths are within scanned directory
	const absoluteRunPath = require('path').resolve(runPath);
	const absoluteOldPath = require('path').resolve(oldFilePath);
	const absoluteNewPath = require('path').resolve(newFilePath);
	
	if (!absoluteOldPath.startsWith(absoluteRunPath) || !absoluteNewPath.startsWith(absoluteRunPath)) {
		console.error('SECURITY ERROR: Attempted to rename file outside scanned directory!');
		console.error('  Scanned directory:', absoluteRunPath);
		console.error('  Old file path:', absoluteOldPath);
		console.error('  New file path:', absoluteNewPath);
		return;
	}
	
	var callback = function(ret) {
		console.log('✓ File renamed successfully');
	};
	fs.rename(oldFilePath, newFilePath, callback);
}

function deleteFile(filePath) {
	console.log('Deleting file:', filePath);
	
	// Double-check the file is in scope before deletion
	const absoluteRunPath = path.resolve(runPath);
	const absoluteFilePath = path.resolve(filePath);
	
	if (!absoluteFilePath.startsWith(absoluteRunPath)) {
		console.error('SECURITY ERROR: Attempted to delete file outside scanned directory!');
		console.error('  Scanned directory:', absoluteRunPath);
		console.error('  Attempted file:', absoluteFilePath);
		return;
	}
	
	if (!fs.existsSync(absoluteFilePath)) {
		console.error('ERROR: File does not exist:', filePath);
		return;
	}
	
	fs.unlinkSync(filePath);
	console.log('✓ File deleted successfully');
}

function isInRunPath(filePath) {
	try {
		// Resolve both paths to absolute normalized paths
		const absoluteRunPath = path.resolve(runPath);
		const absoluteFilePath = path.resolve(filePath);
		
		// Get relative path from runPath to filePath
		const relativePath = path.relative(absoluteRunPath, absoluteFilePath);
		
		// If relative path is empty, file is the run path itself
		if (relativePath === '') {
			return false;
		}
		
		// If relative path starts with '..' or is absolute, file is outside runPath
		if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
			console.log('File is outside scanned directory:', filePath);
			return false;
		}
		
		// Check if file actually exists within the scanned directory
		if (!fs.existsSync(absoluteFilePath)) {
			console.log('File does not exist:', filePath);
			return false;
		}
		
		// Verify the file is indeed within runPath by checking the resolved path
		if (!absoluteFilePath.startsWith(absoluteRunPath)) {
			console.log('File is not within scanned directory:', filePath);
			return false;
		}
		
		return true;
	} catch (err) {
		console.log('Error checking file path:', err.message);
		return false;
	}
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
	rotate(filePath, -90);
}

function rotateLeft(filePath) {
	console.log('rotateLeft:', filePath);
	rotate(filePath, 90);
}


function Photo(photo, filePath) {
	// Convert Windows path to web path
	var webPath = filePath;
	if (filePath) {
		// Get relative path from runPath
		var relativePath = path.relative(runPath, filePath);
		// Convert Windows backslashes to forward slashes for web
		webPath = '/photos/' + relativePath.replace(/\\/g, '/');
	}
	
	photo = photo || {
		path: 		path.dirname(filePath),
		fileName: 	path.basename(filePath),
		filePath: 	filePath,
		webPath:	webPath
	};

	if (!photo.filePath) {
		if (photo.path) {
			photo.filePath = photo.path + '/' + photo.fileName
		} else {
			photo.filePath = photo.fileName
		}
	}
	
	// Ensure webPath is set for displaying in browser
	if (!photo.webPath && photo.filePath) {
		var relativePath = path.relative(runPath, photo.filePath);
		photo.webPath = '/photos/' + relativePath.replace(/\\/g, '/');
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