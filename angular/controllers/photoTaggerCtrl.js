photosTaggerApp.controller('photosTaggerCtrl', function($scope, $sce, $interval) {

	const TAG_BEGIN = '[';
	const TAG_END = ']';
	const TAG_SPLIT = ',';

	var timer;

	$scope.data = {
		filterText: '',
		currentPhoto: {},
		selectedTags: [],
		//moviesJson: 'init'
	};
	
	$scope.scrumbleList = function(list, places) {
		places = Math.min(list.length, places);
		for (var i=0; i < places; i++) {
			var rand = Math.floor(Math.random() * list.length);
			var temp = list[rand];
			list[rand] = list[i];
			list[i] = temp;
		}
	};

	$scope.allTagsMap = {};
	$scope.allTags = [];
	$scope.allTagsData = [];
	$scope.allPhotos = photos;	// from photos.js
	$scope.galleryPhotos = photos;
	$scope.numTaggedPhotos = 0;
	$scope.numUntaggedPhotos = 0;
	
	angular.forEach(photos, function(photo) {
		photo.filePath = photo.path + '/' + photo.fileName;

		photo.tags = [];
		var begin = photo.fileName.indexOf(TAG_BEGIN);
		if (begin > -1) {
			var end = photo.fileName.indexOf(TAG_END);
			var tagsStr = photo.fileName.substring(begin+1, end);
			//console.log('tags:', tagsStr);
			photo.tags = tagsStr.split(TAG_SPLIT);
			addTags(photo.tags);
			$scope.numTaggedPhotos++;
		} else {
			$scope.numUntaggedPhotos++;
		}
	});
	//console.log('allTags:', $scope.allTagsMap);
	//console.log('allTagsData:', $scope.allTagsData);
	$scope.scrumbleList($scope.allPhotos, 20);
	$scope.data.currentPhoto = $scope.allPhotos[0];
	
	$(".tags input").focus();
	
	$scope.nextPhoto = function() {
		var rand = Math.floor(Math.random() * $scope.galleryPhotos.length);
		$scope.data.currentPhoto = $scope.galleryPhotos[rand];
		//console.log('currentPhoto:', $scope.data.currentPhoto);
		$(".tags input").focus();
		if ($scope.data.currentPhoto.tags.length) {
			$scope.nextPhoto();
		}
	};

	$scope.onApplyPhoto = function(photo) {
		// add tags to collection
		addTags(photo.tags);
		if (photo.tags.length) {
			$scope.numTaggedPhotos++;
			$scope.numUntaggedPhotos--;
		}

		$scope.nextPhoto();
	};

	$scope.removePhoto = function(photo) {
		$scope.allPhotos.splice($scope.allPhotos.indexOf(photo), 1);
		$scope.galleryPhotos.splice($scope.galleryPhotos.indexOf(photo), 1);

		$scope.nextPhoto();
	};

	$scope.toggleTimerMode = function() {
		console.log('toggleTimerMode');
		$scope.data.timerMode = !$scope.data.timerMode;
		if ($scope.data.timerMode) {
			var times = 10;
			timer = $interval(function() {
				console.log('interval');
				if (times > 0) {
					$scope.nextPhoto();
				} else {
					$scope.toggleTimerMode();
				}
				times--;
			}, 5000, 10);
		} else {
			$interval.cancel(timer);
		}
	};

	$scope.selectTag = function(tag) {
		console.log('ctrl selectTag:', $scope.data.selectedTags);
		$scope.data.selectedTag = tag.name;

		$scope.galleryPhotos = $scope.allPhotos.filter(function(photo) {
			for (var i=0; i<photo.tags.length; i++) {
				if ($scope.data.selectedTags.includes(photo.tags[i])) {
					return true;
				}
			}
			return false;
		});
	};

	$scope.$on('selectTagsChanged', function() {
		console.log('photosTaggerCtrl: selectTagsChanged');
	});

	$scope.selectPhoto = function(photo) {
		console.log('ctrl selectPhoto:', photo);
		$scope.data.currentPhoto = photo;
	};

	$scope.handleTagsDone = function(photo) {
				console.log('handleTagsDone');
			};

	function addTags(tags) {
		angular.forEach(tags, function(tagName) {
			if (!$scope.allTagsMap[tagName]) {
				var tagData = {name: tagName, number: 1};
				$scope.allTagsMap[tagName] = tagData;
				$scope.allTags.push(tagName);
				$scope.allTagsData.push(tagData);
			} else {
				$scope.allTagsMap[tagName].number++;
			}
		});
	}

});