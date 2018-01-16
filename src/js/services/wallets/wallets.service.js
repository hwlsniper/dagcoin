(() => {
  'use strict';

  angular
    .module('copayApp.services')
    .factory('Wallets', Wallets);

  Wallets.$inject = [];

  function Wallets() {
    return {
      createWallet
    };

    function createWallet() {
      return true;
    }
  }
})();
