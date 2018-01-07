(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactsController', ContactsController);

  ContactsController.$inject = ['addressbookService'];

  function ContactsController(addressbookService) {
    const contacts = this;

    addressbookService.list((err, list) => {
      contacts.list = list;
    });

    contacts.toggleFavorite = (contact) => {
      contact.favorite = !contact.favorite;

      addressbookService.update(contact, (err) => {
        if (err) {
          contact.favorite = !contact.favorite;
          console.error(err);
        }
      });
    };
  }
})();
