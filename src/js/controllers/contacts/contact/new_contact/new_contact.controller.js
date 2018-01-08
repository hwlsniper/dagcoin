(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('NewContactController', NewContactController);

  NewContactController.$inject = ['addressbookService', '$state', 'gettextCatalog'];

  function NewContactController(addressbookService, $state, gettextCatalog) {
    const contact = this;

    contact.onQrCodeScanned = (uri) => {
      contact.address_error = '';

      require('byteballcore/uri.js').parseUri(uri, {
        ifError(err) {
          const conf = require('byteballcore/conf.js');
          const noPrefixRegex = new RegExp(`.*no.*${conf.program}.*prefix.*`, 'i');
          if (noPrefixRegex.test(err.toString())) {
            contact.address_error = gettextCatalog.getString('Incorrect Dagcoin Address');
          } else {
            contact.address_error = err;
          }
        },
        ifOk(objRequest) {
          console.log(`request: ${JSON.stringify(objRequest)}`);
          contact.address_error = '';
          contact.address = objRequest.address;
        },
      });
    };

    contact.create = () => {
      contact.address_error = '';

      addressbookService.add({
        first_name: contact.first_name,
        last_name: contact.last_name,
        address: contact.address,
        email: contact.email,
        description: contact.description
      }, (err) => {
        if (!err) {
          return $state.go('contacts');
        }
        contact.address_error = err;
        console.warn(err);
      });
    };
  }
})();
