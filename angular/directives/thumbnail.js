photosTaggerApp
.directive('thumbnail', [
			function() {
	
    return {
        restrict: 'E',
        replace : false,
		scope: {
			photo: '=',
		},
        template: 	
        	'<div class="thumbnail-image-container">' +
				'<img src="{{photo.filePath}}" class="img-thumbnail" width="300" height="300">' +
			'</div>',

        link: function(scope, element, attrs) {
        	//console.log('thumbnails init');
        }
    }
}]);