(function () {
  'use strict';

  angular
    .module('copayApp.services')
    .factory('animationService', animationService);

  animationService.$inject = ['isCordova'];

  function animationService(isCordova) {
    return {
      modalAnimated: {
        slideUp: isCordova ? 'full animated slideInUp' : 'full',
        slideRight: isCordova ? 'full animated slideInRight' : 'full',
        slideOutDown: isCordova ? 'slideOutDown' : 'hideModal',
        slideOutRight: isCordova ? 'slideOutRight' : 'hideModal'
      }
    };
  }
}());
