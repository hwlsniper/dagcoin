(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactsController', ContactsController);

  ContactsController.$inject = ['AddressBook'];

  function ContactsController(AddressBook) {
    const contacts = this;

    contacts.toggleFavorite = (contact) => {
      contact.favorite = !contact.favorite;

      AddressBook.update(contact.address, {favorite: contact.favorite}, (err) => {
        if (err) {
          contact.favorite = !contact.favorite;
          console.error(err);
        }

        loadList();
      });
    };

    function loadList() {
      contacts.list = {};
      contacts.listTotal = 0;
      contacts.favoriteList = {};
      contacts.favoriteListTotal = 0;

      AddressBook.list((err, list) => {
        /**
         * Populate Contacts and Favorite Contacts
         */
        Object.keys(list).map((address) => {
          const contact = list[address];
          let firstLetter = contact.first_name.charAt(0).toUpperCase();

          if ('0123456789'.indexOf(firstLetter) !== -1) {
            firstLetter = '#';
          }

          contact.firstLetter = firstLetter;

          if (!contacts.list[firstLetter]) {
            contacts.list[firstLetter] = [];
          }

          contacts.list[firstLetter].push(contact);
          contacts.listTotal += 1;

          if (contact.favorite) {
            if (!contacts.favoriteList[firstLetter]) {
              contacts.favoriteList[firstLetter] = [];
            }
            contacts.favoriteList[firstLetter].push(contact);
            contacts.favoriteListTotal += 1;
          }
          return true;
        });

        /**
         * Sort contacts in alphabetical order
         */
        Object.keys(contacts.list).map((letter) => {
          contacts.list[letter] = contacts.list[letter].sort((a, b) => {
            const nameA = a.first_name.toUpperCase();
            const nameB = b.first_name.toUpperCase();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
          return true;
        });
      });
    }

    loadList();
  }
})();
