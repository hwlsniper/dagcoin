(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('EditContactController', EditContactController);

  EditContactController.$inject = ['$stateParams', 'AddressBook', '$state'];

  function EditContactController($stateParams, AddressBook, $state) {
    const contact = this;
    contact.backParams = { address: $stateParams.address };
    let contactData = {};

    contact.update = () => {
      contactData.first_name = contact.first_name;
      contactData.last_name = contact.last_name;
      contactData.email = contact.email;
      contactData.description = contact.description;

      AddressBook.update(contactData, () => {
        $state.go('contact', contact.backParams);
      });
    };

    contact.address = $stateParams.address;
    AddressBook.getContact(contact.address, (err, data) => {
      contactData = data;
      Object.keys(data).map((key) => {
        contact[key] = data[key] || '';
        return true;
      });
    });
  }
})();
