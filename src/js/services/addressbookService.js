(() => {
  'use strict';

  angular
    .module('copayApp.services')
    .factory('addressbookService', addressbookService);

  addressbookService.$inject = ['storageService', 'profileService'];

  function addressbookService(storageService, profileService) {
    let contacts = false;

    return {
      getContact,
      list,
      favorites,
      add,
      update,
      remove,
      removeAll
    };

    function addressBookKey() {
      const fc = profileService.focusedClient;
      const network = fc.credentials.network;
      return `addressbook-${network}`;
    }

    /**
     * Get contact by wallet address
     * @param addr address of the wallet
     * @param cb callback
     * @returns {*}
     */

    function getContact(addr, cb) {
      list(() => {
        if (!contacts[addr]) {
          return cb(false, false);
        }
        return cb(false, contacts[addr]);
      });
    }

    function list(cb) {
      if (!contacts) {
        storageService.get(addressBookKey(), (err, ab) => {
          if (err) {
            return cb('Could not access storage.', {});
          }
          if (ab) {
            const json = JSON.parse(ab);
            contacts = {};

            Object.keys(json).map((address) => {
              if (typeof json[address] === 'string') {
                contacts[address] = {
                  address,
                  first_name: json[address].split(' ')[0],
                  last_name: json[address].split(' ')[1]
                };
              } else {
                contacts[address] = json[address];
              }
              return true;
            });
          } else {
            contacts = {};
          }
          list(cb);
        });
      } else {
        return cb(false, contacts);
      }
    }

    function favorites(cb) {
      list((listError, ab) => {
        if (!listError) {
          const favoritesList = [];

          Object.keys(ab).map((address) => {
            const contact = ab[address];
            if (contact.favorite) {
              favoritesList.push(contact);
            }
            return true;
          });

          return cb(false, favoritesList);
        }

        return cb(listError, {});
      });
    }

    function add(entry, cb) {
      list((listError, ab) => {
        if (listError) {
          return cb(listError);
        }
        const addressBook = ab;

        if (addressBook[entry.address]) {
          return cb('Address already exists');
        }

        addressBook[entry.address] = entry;
        return storageService.set(addressBookKey(), JSON.stringify(addressBook), (setAddressbookError) => {
          if (setAddressbookError) {
            return cb('Error adding new entry');
          }
          return list((err, addressList) => cb(err, addressList));
        });
      });
    }

    function update(entry, cb) {
      list((listError) => {
        if (listError) {
          return cb(listError);
        }

        contacts[entry.address] = entry;
        return storageService.set(addressBookKey(), JSON.stringify(contacts), (setAddressbookError) => {
          if (setAddressbookError) {
            return cb(`Error updating entry: ${entry.address}`);
          }
          return cb(false);
        });
      });
    }

    function remove(addr, cb) {
      list((err, ab) => {
        if (err) {
          return cb(err);
        }
        if (!contacts[addr]) {
          return cb('Entry does not exist');
        }
        delete contacts[addr];
        return storageService.set(addressBookKey(), JSON.stringify(ab), (error) => {
          if (error) {
            return cb('Error deleting entry');
          }
          return list((listError, addressBook) => cb(listError, addressBook));
        });
      });
    }

    function removeAll(cb) {
      contacts = {};
      storageService.remove(addressBookKey(), (err) => {
        if (err) {
          return cb('Error deleting addressbook');
        }
        return cb();
      });
    }
  }
})();
