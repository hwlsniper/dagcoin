(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactController', ContactController);

  ContactController.$inject = ['addressbookService', '$stateParams'];

  function ContactController(addressbookService, $stateParams) {
    const contact = this;

    addressbookService.getContact($stateParams.address, (err, data) => {
      contact.address = $stateParams.address;
      contact.first_name = data.first_name;
      contact.last_name = data.last_name;
    });
  }
})();
