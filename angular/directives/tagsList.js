photosTaggerApp
//angular.module('photosTaggerApp')
.directive('tagsList', [
			function() {
	
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
        /*template: 	
			'<div class="" style="border: 1px solid; text-align: right;">' +
				'tagsList' +
				'<ul>' + 
					'<li ng-repeat="tag in tags | orderBy:\'-number\'" ng-click="selectTag(tag)" ' + 
						'class="tag" ng-class="{selected: selected.includes(tag)}">' + 
						'{{tag.name}} ({{tag.number}})' + 
						' <span ng-click="$event.stopPropagation(); selectTag(tag, true)"> +</span>' +
					'</li>' + 
				'</ul>' +
			'</div>',
		*/
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
        		scope.selected.push(tag);

        		// invoke func
        		var selectFunc = scope.onSelect();
        		selectFunc(tag);
        	};
        }
    }
}]);