(function () {
  'use strict';

  angular.module('gitLodeApp').directive('autoScroll', autoScrollDirective);

  autoScrollDirective.$inject = ['$timeout'];

  function autoScrollDirective($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        scope.$watchCollection(
          function () {
            return element.children().length;
          },
          function (newLength, oldLength) {
            if (newLength !== oldLength) {
              $timeout(function () {
                element[0].scrollTop = element[0].scrollHeight;
              });
            }
          }
        );
      },
    };
  }
})();
