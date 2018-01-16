(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactController', ContactController);

  ContactController.$inject = ['AddressBook', '$stateParams', 'ngDialog'];

  function ContactController(AddressBook, $stateParams, ngDialog) {
    const contact = this;
    AddressBook.getContact($stateParams.address, (err, data) => {
      Object.keys(data).map((key) => {
        contact[key] = data[key];
        return true;
      });
    });

    contact.editContact = () => {
      ngDialog.open({
        template: 'controllers/contacts/contact/edit_modal.template.html',
        controller: 'EditContactModalController'
      });
    };
  }
})();
