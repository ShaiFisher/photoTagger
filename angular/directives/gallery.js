photosTaggerApp
.directive('gallery', [
			function() {
	
    return {
        restrict: 'E',
        replace : false,
		scope: {
			photos: '=',
			onSelect: '&'
		},
        template: 	
			'<div class="thumbnailsContainer">' +
				'<div class="row">' +
					'<div class="thumbnail-cell" ng-repeat="photo in photos | limitTo:20" ' +
						'	ng-click="onPhotoClick(photo)">' +

						'<thumbnail photo="photo"></thumbnail>' +
					'</div>' +
				'</div>' +
			'</div>',

        link: function(scope, element, attrs) {

        	scope.onPhotoClick = function(photo) {
        		console.log('onPhotoClick');
        		var onSelectFunc = scope.onSelect();
        		onSelectFunc(photo);
        	};
        }
    }
}]);