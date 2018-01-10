(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('SendController', SendController);

  SendController.$inject = ['gettextCatalog'];

  function SendController(gettextCatalog) {
    const vm = this;

    vm.onQrCodeScanned = (uri) => {
      require('byteballcore/uri.js').parseUri(uri, {
        ifError(err) {
          console.log(err);
          const conf = require('byteballcore/conf.js');
          const noPrefixRegex = new RegExp(`.*no.*${conf.program}.*prefix.*`, 'i');
          if (noPrefixRegex.test(err.toString())) {
            vm.addressError = gettextCatalog.getString('Incorrect Dagcoin Address');
          } else {
            vm.addressError = err;
          }
        },
        ifOk(objRequest) {
          console.log(`request: ${JSON.stringify(objRequest)}`);
          /* if (objRequest.type === 'address') {
            root.send(() => {
              $rootScope.$emit('paymentRequest', objRequest.address, objRequest.amount, objRequest.asset);
            });
          } else if (objRequest.type === 'pairing') {
            $rootScope.$emit('Local/CorrespondentInvitation', objRequest.pubkey, objRequest.hub, objRequest.pairing_secret);
          } else if (objRequest.type === 'auth') {
            authService.objRequest = objRequest;
            root.path('authConfirmation');
          } else {
            throw Error(`unknown url type: ${objRequest.type}`);
          } */
        },
      });

    };
  }
})();
