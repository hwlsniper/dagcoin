(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ReceiveController', ReceiveController);

  ReceiveController.$inject = ['ENV', 'isCordova', 'gettextCatalog', 'nodeWebkit', '$timeout'];

  function ReceiveController(ENV, isCordova, gettextCatalog, nodeWebkit, $timeout) {
    const vm = this;
    vm.protocol = ENV.protocolPrefix;

    vm.copyAddress = (addr) => {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(addr);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      } else if (nodeWebkit.isDefined()) {
        nodeWebkit.writeToClipboard(addr);
      }

      vm.tooltipCopiedShown = true;

      $timeout(() => {
        vm.tooltipCopiedShown = false;
      }, 1000);
    };
  }
})();
