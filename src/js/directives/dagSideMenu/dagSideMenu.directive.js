(() => {
  'use strict';

  /**
   * @desc Menu located in the left sidebar
   * @example <dag-side-menu></dag-side-menu>
   */
  angular
    .module('copayApp.directives')
    .directive('dagSideMenu', dagSideMenu);

  dagSideMenu.$inject = ['$rootScope'];

  function dagSideMenu($rootScope) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'directives/dagSideMenu/dagSideMenu.template.html',
      scope: {},
      link: ($scope) => {
        $scope.closeMenu = $rootScope.closeSideBar;

        $scope.lists = [{
          category: 'Account',
          links: [
            {
              title: 'My Wallets',
              icon: 'wallet',
              state: 'walletHome'
            }, {
              title: 'Send',
              icon: 'paperplane',
              state: 'send'
            }, {
              title: 'Receive',
              icon: 'banknote',
              state: 'receive'
            }, {
              title: 'Address Book',
              icon: 'import_contacts',
              state: 'contacts'
            }, {
              title: 'Chat',
              icon: 'chat_bubble_outline',
              state: 'correspondentDevices'
            }
          ]
        }, {
          category: 'More',
          links: [
            {
              title: 'Settings',
              icon: 'cog',
              state: 'preferencesGlobal'
            }
          ]
        }];
      }
    };
  }
})();
