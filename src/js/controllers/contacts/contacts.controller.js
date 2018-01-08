(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactsController', ContactsController);

  ContactsController.$inject = ['addressbookService'];

  function ContactsController(addressbookService) {
    const contacts = this;

    contacts.clearFilter = () => {
      contacts.search = '';
    };

    contacts.toggleFavorite = (contact) => {
      contact.favorite = !contact.favorite;

      addressbookService.update(contact, (err) => {
        if (err) {
          contact.favorite = !contact.favorite;
          console.error(err);
        }

        if (contact.favorite) {
          contacts.favoriteListTotal += 1;
        } else {
          contacts.favoriteListTotal -= 1;
        }

        loadList();
      });
    };

    function loadList() {
      contacts.list = {};
      contacts.listTotal = 0;
      contacts.favoriteList = {};
      contacts.favoriteListTotal = 0;

      addressbookService.list((err, list) => {
        Object.keys(list).map((address) => {
          const contact = list[address];
          const firstLetter = contact.first_name.charAt(0).toUpperCase();

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
