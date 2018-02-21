(() => {
  'use strict';

  angular
    .module('copayApp.controllers')
    .controller('EditContactController', EditContactController);

  EditContactController.$inject = ['$stateParams', 'addressbookService', '$state'];

  function EditContactController($stateParams, addressbookService, $state) {
    const MAX_LENGTH_OF_DESCRIPTION = 500;
    const contact = this;
    contact.maxLengthOfDescription = MAX_LENGTH_OF_DESCRIPTION;
    const contactData = addressbookService.getContact($stateParams.address) || {};

    contact.data = {};
    Object.keys(contactData).map((key) => {
      contact.data[key] = contactData[key];
      return true;
    });

    // arranges max length of desc in case of user entered description whose length more than MAX_LENGTH_OF_DESCRIPTION
    const descriptionLength = contact.data.description ? contact.data.description.length : 0;
    contact.maxLengthOfDescription = MAX_LENGTH_OF_DESCRIPTION < descriptionLength ? descriptionLength : MAX_LENGTH_OF_DESCRIPTION;
    contact.backParams = { address: $stateParams.address };

    contact.update = () => {
      console.log(contact.data);
      addressbookService.update(contact.data, (error, record) => {
        const exists = !!record;
        if (exists) {
          $state.go('contact', contact.backParams);
        }
      });
    };
  }
})();
