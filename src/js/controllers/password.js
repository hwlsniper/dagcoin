(function () {
  'use strict';

  angular.module('copayApp.controllers').controller('passwordController',
    function ($rootScope, $scope, $timeout, profileService, notification, go, gettextCatalog) {
      const self = this;

      self.validationErrors = [];
      let passwordTemp;

      self.isVerification = false;
      self.passwordVisible = false;
      document.getElementById('passwordInput').focus();

      self.close = function (cb) {
        return cb('No password given');
      };

      self.set = function (isSetup, cb) {
        self.error = false;

        if (isSetup && !self.isVerification) {
          document.getElementById('passwordInput').focus();
          self.isVerification = true;
          passwordTemp = self.password;
          self.password = null;
          $timeout(() => {
            $rootScope.$apply();
          });
          return;
        }
        if (isSetup) {
          if (passwordTemp !== self.password) {
            self.error = gettextCatalog.getString('Passwords do not match');
            return;
          }
        }
        cb(null, self.password);
      };

      self.validate = function () {
        self.validationErrors = [];

        if (self.password.length < 8) {
            self.validationErrors.push(gettextCatalog.getString('Password must be at least 8 characters long'));
        }
        if (self.password.search(/[a-z]/i) < 0) {
            self.validationErrors.push(gettextCatalog.getString('Password must contain at least one letter'));
        }
        if (self.password.search(/[0-9]/) < 0) {
            self.validationErrors.push(gettextCatalog.getString('Password must contain at least one digit'));
        }
        if (self.password.search(/[!@#$%^&*]/) < 0) {
            self.validationErrors.push(gettextCatalog.getString('Password must contain at least one special character'));
        }
        return self.validationErrors.length <= 0;
      };
    });
}());
