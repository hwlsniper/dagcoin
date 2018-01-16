(() => {
  'use strict';

  angular
    .module('copayApp.services')
    .factory('Device', Device);

  Device.$inject = [];

  function Device() {
    return {
      isMobile,
      isCordova
    };

    function isMobile(type) {
      let value = false;

      if (navigator.userAgent.match(/Android/i)) {
        value = 'Android';
      } else if (navigator.userAgent.match(/BlackBerry/i)) {
        value = 'BlackBerry';
      } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        value = 'iOS';
      } else if (navigator.userAgent.match(/Opera Mini/i)) {
        value = 'Opera';
      } else if (navigator.userAgent.match(/IEMobile/i)) {
        value = 'Windows';
      } else if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
        value = 'Safari';
      }

      if (type && value) {
        return (type === value);
      }

      return value;
    }

    function isCordova() {
      return !!window.cordova;
    }
  }
})();
