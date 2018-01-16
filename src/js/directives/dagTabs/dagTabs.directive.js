/* eslint-disable no-undef */
(() => {
  'use strict';

  angular
    .module('copayApp.directives')


    /**
     * @desc collection of tabs
     * @example <dag-tabset></dag-tabset>
     */
    .directive('dagTabset', dagTabset)

    /**
     * @desc single tab
     * @example <dag-tab heading="Header"></dag-tab>
     */
    .directive('dagTab', dagTab);

  dagTabset.$inject = [];

  function dagTabset() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {},
      templateUrl: 'directives/dagTabs/dagTabs.template.html',
      controllerAs: 'tabset',
      controller($scope, $element) {
        const vm = this;
        vm.tabs = [];
        vm.activeTab = 0;
        vm.slider_width = 50;
        vm.onLeave = false;
        vm.onEnter = false;

        vm.addTab = (tab) => {
          vm.tabs.push(tab);

          if (vm.tabs.length === 1) {
            tab.active = true;
          }

          vm.slider_width = ($element[0].getElementsByClassName('dag_tabs')[0].clientWidth / vm.tabs.length);
        };

        vm.select = (selectedTab, index) => {
          if (vm.activeTab === index) {
            return false;
          }

          vm.tabs = vm.tabs.map((tab) => {
            tab.active = false;
            return tab;
          });

          vm.activeTab = index;

          selectedTab.active = true;

          return true;
        };
      }
    };
  }

  dagTab.$inject = [];

  function dagTab() {
    return {
      restrict: 'E',
      transclude: true,
      template: '<div class="dag_tabs_tabpanel" ng-show="active" ng-transclude></div>',
      require: '^dagTabset',
      scope: {
        heading: '@',
        tabClick: '&',
        selected: '='
      },
      link: ($scope, element, attr, dagtabsetCtrl) => {
        $scope.active = false;
        dagtabsetCtrl.addTab($scope);
      }
    };
  }
})();
