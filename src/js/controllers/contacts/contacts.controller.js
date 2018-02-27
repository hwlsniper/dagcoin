(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('ContactsController', ContactsController);

  ContactsController.$inject = ['addressbookService', '$timeout', '$scope', 'lodash'];

  function ContactsController(addressbookService, $timeout, $scope, lodash) {
    const contacts = this;

    contacts.toggleFavorite = (contact) => {
      contact.favorite = !contact.favorite;
      addressbookService.update(contact, (error, record) => {
        if (record.favorite) {
          contacts.favoriteListTotal += 1;
        } else {
          contacts.favoriteListTotal -= 1;
        }
        loadList(contacts.search);
      });
    };

    contacts.activeTabIndex = 0;
    contacts.swiper = {};
    contacts.search = '';

    contacts.onReadySwiper = (swiper) => {
      contacts.swiper = swiper;

      swiper.on('slideChangeStart', () => {
        $timeout(() => {
          contacts.activeTabIndex = swiper.activeIndex;
        }, 0);
      });
    };

    contacts.activeTab = index => contacts.activeTabIndex === index;

    function loadList(filterValue) {
      contacts.list = {};
      contacts.listTotal = 0;
      contacts.favoriteList = {};
      contacts.favoriteListTotal = 0;

      addressbookService.list((list) => {
        console.log(list);

        function hashSort(src) {
          const keys = Object.keys(src);
          const target = {};
          keys.sort();
          keys.forEach((key) => {
            target[key] = src[key];
          });
          return target;
        }

        function compareFn(propertyProjection) {
          return (a, b) => {
            const nameA = propertyProjection(a);
            const nameB = propertyProjection(b);
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          };
        }

        Object.keys(list).map((address) => {
          const contact = list[address];
          const firstLetter = contact.first_name.charAt(0).toUpperCase();
          const firstNameCondition = filterValue && contact.first_name.toUpperCase().indexOf(filterValue.toUpperCase()) !== -1;
          const lastNameCondition = filterValue && lodash.has(contact, 'last_name') && contact.last_name.toUpperCase().indexOf(filterValue.toUpperCase()) !== -1;

          if (!contacts.list[firstLetter] && firstLetter) {
            contacts.list[firstLetter] = [];
          }

          if (!filterValue || firstNameCondition || lastNameCondition) {
            contacts.list[firstLetter].push(contact);
            contacts.listTotal += 1;
          }

          if (contacts.list[firstLetter].length <= 0) {
            contacts.list = lodash.omit(contacts.list, firstLetter);
          }

          if (contact.favorite && (!filterValue || firstNameCondition || lastNameCondition)) {
            if (!contacts.favoriteList[firstLetter]) {
              contacts.favoriteList[firstLetter] = [];
            }
            contacts.favoriteList[firstLetter].push(contact);
            contacts.favoriteListTotal += 1;
          }

          return true;
        });

        Object.keys(contacts.list).map((letter) => {
          contacts.list[letter] = contacts.list[letter].sort(compareFn(item => item.first_name.toUpperCase()));
          return true;
        });

        contacts.list = hashSort(contacts.list);
        contacts.favoriteList = hashSort(contacts.favoriteList);

        if (contacts.listTotal <= 0) {
          contacts.activeTabIndex = 0;
        }
      });
    }

    $scope.$watch('contacts.search', (value) => {
      loadList(value);
    });

    loadList();
  }
})();
