(function () {
  'use strict';

  angular.module('copayApp.controllers').controller('preferencesNotificationsController',
    function ($scope, $q, $rootScope, $log, $modal, configService, uxLanguage, pushNotificationsService, lodash) {
      $scope.pushNotifications = false;

      this.init = function () {
        const config = configService.getSync();
        $scope.pushNotifications = pushNotificationsService.pushIsAvailableOnSystem && config.pushNotifications.enabled;
      };

      const unwatchPushNotifications  = $scope.$watch('pushNotifications', watchPushNotifications);

      $scope.$on('$destroy', () => {
        unwatchPushNotifications();
      });

      function watchPushNotifications (newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        const opts = { pushNotifications: { enabled: newVal } };
        if (newVal) {
          pushNotificationsService.pushNotificationsRegister((registrationId, err) => {
            setPushNotificationSwitch(opts, registrationId, err);
          });
        } else {
          pushNotificationsService.pushNotificationsUnregister((registrationId, err) => {
            setPushNotificationSwitch(opts, registrationId, err);
          });
        }
      }

      /**
       *
       * @param opts
       * @param registrationId
       * @param err
       */
      function setPushNotificationSwitch (opts, registrationId, err) {
        if (lodash.isEmpty(err)) {
          configService.set(opts, (err) => {
            if (err) {
              $log.debug(err);
            }
          });
        } else {
          // TODO alert
        }
      }

    });
}());
