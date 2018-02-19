(function () {
  'use strict';

  angular.module('copayApp.controllers').controller('preferencesNotificationsController',
    function ($scope, $q, $rootScope, $log, $modal, configService, uxLanguage, pushNotificationsService, lodash, gettextCatalog) {
      $scope.pushNotifications = false;

      this.init = function () {
        const config = configService.getSync();
        $scope.pushNotifications = pushNotificationsService.pushIsAvailableOnSystem && config.pushNotifications.enabledNew;
      };

      const unwatchPushNotifications  = $scope.$watch('pushNotifications', watchPushNotifications);

      $scope.$on('$destroy', () => {
        unwatchPushNotifications();
      });

      function watchPushNotifications (newVal, oldVal) {
        if (newVal === oldVal) {
          return;
        }
        const opts = { pushNotifications: { enabledNew: newVal } };
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
       * @param registrationId In case of failure registrationId is empty (null or undefined)
       * @param err In case of success err is empty
       */
      function setPushNotificationSwitch (opts, registrationId, err) {
        if (lodash.isEmpty(err)) {
          configService.set(opts, (err) => {
            if (err) {
              $log.debug(err);
              $rootScope.$emit('Local/ShowAlert', err, 'fi-alert', () => { });
            } else {
              $rootScope.$emit('Local/ShowAlert',
                opts.pushNotifications.enabled ?
                  gettextCatalog.getString('Push Notifications enabled.'):
                  gettextCatalog.getString('Push Notifications disabled.'),
                'fi-alert', () => { });
            }
          });
        } else {
          $rootScope.$emit('Local/ShowAlert', err, 'fi-alert', () => { });
        }
      }

    });
}());
