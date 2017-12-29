(function () {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactsController', ContactsController);

  ContactsController.$inject = ['addressbookService', 'storageService', '$log'];

  function ContactsController(addressbookService, storageService, $log) {
    const contacts = this;

    addressbookService.list((err, list) => {
      $log.debug(err);
      contacts.list = list;
    });

    contacts.toggleFavorite = (contact) => {
      contact.favorite = !contact.favorite;
      console.log(contact);
    };
  }
}());
