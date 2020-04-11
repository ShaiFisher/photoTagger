photosTaggerApp
//angular.module('photosTaggerApp')
.directive('tagsList', [ '$rootScope',
			function($rootScope) {
	
    return {
        //restrict: 'E',
        replace : false,
		scope: {
			tags: '=',
			tagsMap: '=',
			onSelect: '&',
			selected: '='
		},
		templateUrl: 'tagsList.html',
        link: function(scope, element, attrs) {
        	//console.log('tags-list init');
        	scope.selected = scope.selected || [];

        	scope.selectTag = function(tag, add) {
        		console.log('selectTag:', tag);

        		// clear previous tags
        		if (!add) {
        			console.log('selected before:', scope.selected);
        			scope.selected.splice(0, scope.selected.length);
        		}

        		// add current tag
        		scope.selected.push(tag.name);

        		// invoke func
        		var selectFunc = scope.onSelect();
        		selectFunc(tag);

                // send event
                //$rootScope.$broadcast('selectTagsChanged'); 
        	};
        }
    }
}]);