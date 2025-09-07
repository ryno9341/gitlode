(function () {
  'use strict';

  angular
    .module('gitLodeApp', [])
    .constant('JSZip', window.JSZip)
    .constant('saveAs', window.saveAs);
})();
