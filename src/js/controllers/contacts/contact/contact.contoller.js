(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactController', ContactController);

  ContactController.$inject = ['addressbookService', '$stateParams', 'ngDialog'];

  function ContactController(addressbookService, $stateParams, ngDialog) {
    const contact = this;

    addressbookService.getContact($stateParams.address, (err, data) => {
      contact.address = $stateParams.address;
      contact.first_name = data.first_name;
      contact.last_name = data.last_name;
    });

    contact.editContact = () => {
      ngDialog.open({
        template: '<ul><li><svg-icon name="mode_edit"></svg-icon>Edit</li><li><svg-icon name="delete_forever"></svg-icon>Delete</li></ul>',
        plain: true
      });
    };
  }
})();
