(function () {
  'use strict';

  angular.module('copayApp.controllers').controller('preferencesNotificationsController',
    function ($scope, $q, $rootScope, $log, $modal, configService, uxLanguage, pushNotificationsService) {
      $scope.pushNotifications = false;

      this.init = function () {
        const config = configService.getSync();
        $scope.pushNotifications = config.pushNotifications.enabled;
      };


      // Before switching the push notification checkbox the (un)registration request must be completed.
      // So that on mouse down is used instead of $watch
      $scope.switchPush = () => {
        const newVal = !$scope.pushNotifications;
        const opts = {
          pushNotifications: {
            enabled: newVal
          }
        };
        if (newVal) {
          pushNotificationsService.pushNotificationsRegister()
            .then(() => {
              configService.set(opts, (err) => { if (err) $log.debug(err); });
              $scope.pushNotifications = newVal;
            })
            .catch(() => {
              alert('error registering for push notification');
            });
        } else {
          pushNotificationsService.pushNotificationsUnregister()
            .then(() => {
              configService.set(opts, (err) => { if (err) $log.debug(err); });
              $scope.pushNotifications = newVal;
            })
            .catch(() => {
              alert('error unregistering for push notification');
            });
        }
      };
    });
}());
