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

			// Initialize suggested tags array
			scope.suggestedTags = [];

			// Function to calculate top tags
			var calculateTopTags = function(selectedTag) {
		// Get allTagsData from parent scope
		var allTagsData = scope.$parent.allTagsData || [];
		var allPhotos = scope.$parent.allPhotos || [];
		
		// If no tag is selected, return top 15 by overall usage
		if (!selectedTag) {
			var result = allTagsData.slice().sort(function(a, b) {
				return b.number - a.number;
			}).slice(0, 15);
			return result;
		}			// Calculate co-occurrence scores for the selected tag
			var tagScores = {};
			
			// Go through all photos
			angular.forEach(allPhotos, function(photo) {
				// Check if photo has the selected tag
				var hasSelectedTag = false;
				if (photo.tags && photo.tags.length > 0) {
					for (var i = 0; i < photo.tags.length; i++) {
						var photoTag = photo.tags[i].text || photo.tags[i];
						if (photoTag === selectedTag) {
							hasSelectedTag = true;
							break;
						}
					}
				}
				
				// If photo has the selected tag, count all other tags in that photo
				if (hasSelectedTag) {
					angular.forEach(photo.tags, function(tag) {
						var tagName = tag.text || tag;
						if (tagName !== selectedTag) {
							tagScores[tagName] = (tagScores[tagName] || 0) + 1;
						}
					});
				}
			});
			
			// Convert to array and sort by co-occurrence count
			var coOccurringTags = [];
			angular.forEach(tagScores, function(count, tagName) {
				coOccurringTags.push({name: tagName, number: count});
			});
			
			return coOccurringTags.sort(function(a, b) {
				return b.number - a.number;
			}).slice(0, 15);
		};

		// Update suggested tags whenever photo.tags changes
		scope.$watch('photo.tags', function(newTags) {
			if (newTags && newTags.length > 0) {
				var firstTag = newTags[0].text || newTags[0];
				scope.suggestedTags = calculateTopTags(firstTag);
			} else {
				scope.suggestedTags = calculateTopTags(null);
			}
		}, true);

		scope.addTagToPhoto = function(tagName) {
				// Check if tag already exists
				var tagExists = false;
				if (scope.photo.tags) {
					for (var i = 0; i < scope.photo.tags.length; i++) {
						var existingTag = scope.photo.tags[i].text || scope.photo.tags[i];
						if (existingTag === tagName) {
							tagExists = true;
							break;
						}
					}
				} else {
					scope.photo.tags = [];
				}

			// Add tag if it doesn't exist
			if (!tagExists) {
				scope.photo.tags.push({text: tagName});
			}

			// Set focus on the tags input
			$(".tags input").focus();
		};			scope.applyTags = function(photo) {
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