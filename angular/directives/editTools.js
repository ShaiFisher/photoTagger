photosTaggerApp
.directive('editTools', [
			function() {
	
    return {
        restrict: 'E',
        replace : false,
		scope: {
			photo: '=',
			allTags: '=',
			onDelete: '&',
			onApply: '&'
		},
        templateUrl: 'editTools.html',

        link: function(scope, element, attrs) {

        	scope.getAvailableTags = function($query) {
				return scope.allTags.filter(function(tag) {
					return tag.toLowerCase().indexOf($query.toLowerCase()) != -1;
				});
			};

			scope.applyTags = function(photo) {
				console.log('applyTags:', photo);
				photo.tags = extractTags(photo.tags);
				sendCommand('applyTags: ' + JSON.stringify(photo));

				var func = scope.onApply();
        		func(photo);
			};

			scope.handleTagsDone = function(photo) {
				console.log('handleTagsDone');
			};

			scope.rotateRight = function(photo) {
				console.log('rotateRight:', photo);
				sendCommand('rotateRight: ' + photo.filePath);
			};

			scope.rotateLeft = function(photo) {
				console.log('rotateLeft:', photo);
				sendCommand('rotateLeft: ' + photo.filePath);
			};

			scope.deletePhoto = function(photo) {
				if (confirm('Are you sure?')) {
					console.log('delete', photo);
					sendCommand('delete: ' + photo.filePath);

					var func = scope.onDelete();
        			func(photo);

					/*$scope.allPhotos.splice($scope.allPhotos.indexOf(photo), 1);
					$scope.galleryPhotos.splice($scope.galleryPhotos.indexOf(photo), 1);

					$scope.nextPhoto();*/
				}
			};

        	scope.onPhotoClick = function(photo) {
        		console.log('onPhotoClick');
        		var onSelectFunc = scope.onSelect();
        		onSelectFunc(photo);
        	};


        	function extractTags(tagsObjects) {
				var tags = [];
				angular.forEach(tagsObjects, function(tagObj) {
					tags.push(tagObj.text);
				});
				return tags;
			}

			function addTags(tags) {
				angular.forEach(tags, function(tag) {
					if (!$scope.allTagsMap[tag]) {
						var tagData = {name: tag, number: 1};
						$scope.allTagsMap[tag] = tagData;
						$scope.allTags.push(tag);
						$scope.allTagsData.push(tagData);
					} else {
						$scope.allTagsMap[tag].number++;
					}
				});
			}

			function sendCommand(command) {
				copyText('PhotoTagger: ' + settings.safeWord + ': ' + command);
			}

			function copyText(text) {
				//console.log('copyText:', text);
				$("#copyTextInput").val(text);
				$("#copyTextInput").select();
				document.execCommand('copy');
			};
        }
    }
}]);