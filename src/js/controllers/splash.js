(function () {
  'use strict';

  angular.module('copayApp.controllers').controller('splashController',
    function ($scope, $timeout, $log, configService, profileService, storageService, fileSystemService, go, isCordova) {
      const self = this;

      this.saveDeviceName = function () {
        console.log(`saveDeviceName: ${self.deviceName}`);
        const device = require('byteballcore/device.js');
        device.setDeviceName(self.deviceName);
        const opts = { deviceName: self.deviceName };
        configService.set(opts, () => {
          $timeout(() => {
            self.bDeviceNameSet = true;
          });
        });
      };

      configService.get((err, config) => {
        if (err) {
          throw Error('failed to read config');
        }
        self.deviceName = config.deviceName;
      });

      this.step = isCordova ? 'device_name' : 'registration_type';
      this.registration_type = 'default';
      this.wallet_type = 'light';

      this.setRegistrationType = function () {
        if (this.registration_type === 'default') {
          this.setWalletType();
        } else if (this.registration_type === 'backup') {
          this.setWalletType(() => {
            go.path('initialRecovery');
          });
        } else {
          this.step = 'wallet_type';
        }
      };

      this.setWalletType = function (cb) {
        const bLight = (self.wallet_type === 'light');
        if (!bLight) {
          self.step = 'device_name';
          return;
        }

        const appDataDir = fileSystemService.getDatabaseDirPath();
        const userConfFile = `${appDataDir}/conf.json`;
        fileSystemService.writeFile(userConfFile, JSON.stringify({
          bLight,
          DATABASE_MIGRATION_TOOL: 'native-queries'
        }, null, '\t'), 'utf8', (err) => {
          if (err) {
            throw Error(`failed to write conf.json: ${err}`);
          }
          if (cb) {
            cb();
          } else {
            self.step = 'device_name';
            $scope.$apply();
          }
        });
      };

      this.create = function (noWallet) {
        if (self.creatingProfile) {
          return console.log('already creating profile');
        }
        self.creatingProfile = true;

        return $timeout(() => {
          profileService.create({ noWallet }, (err) => {
            if (err) {
              self.creatingProfile = false;
              $log.warn(err);
              self.error = err;
              $scope.$apply();
              /* $timeout(function() {
               self.create(noWallet);
               }, 3000); */
            }
          });
        }, 100);
      };

      this.init = function () {
        storageService.getDisclaimerFlag((err, val) => {
          if (!val) go.path('disclaimer');

          if (profileService.profile) {
            go.walletHome();
          }
        });
      };
    });
}());
