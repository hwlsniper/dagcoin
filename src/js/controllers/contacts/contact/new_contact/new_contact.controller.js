(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('NewContactController', NewContactController);

  NewContactController.$inject = ['addressbookService', '$state'];

  function NewContactController(addressbookService, $state) {
    const contact = this;

    contact.create = () => {
      addressbookService.add({
        first_name: contact.first_name,
        last_name: contact.last_name,
        address: contact.address
      }, (err) => {
        if (!err) {
          return $state.go('contacts');
        }

        console.warn(err);
      });
    };
  }
})();
