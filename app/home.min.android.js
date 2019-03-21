'use strict';

angular.module('bahmni.common.domain')
    .service('localeService', ['androidDbService',
        function (androidDbService) {
            this.allowedLocalesList = function () {
                return androidDbService.getReferenceData('LocaleList');
            };
        }]);

'use strict';

angular.module('bahmni.common.domain')
    .factory('locationService', ['$bahmniCookieStore', 'offlineService', 'androidDbService', '$q',
        function ($bahmniCookieStore, offlineService, androidDbService, $q) {
            var getAllByTag = function (tags) {
                if (offlineService.getItem('LoginInformation') != null && !offlineService.getItem("allowMultipleLoginLocation")) {
                    var obj = {"data": {"results": [offlineService.getItem('LoginInformation').currentLocation]}};
                    return $q.when(obj);
                }
                return androidDbService.getReferenceData('LoginLocations').then(function (loginLocations) {
                    if (!loginLocations) {
                        var msg = offlineService.getItem("networkError") || "Offline data not set up";
                        return $q.reject(msg);
                    }
                    return loginLocations;
                });
            };

            var getByUuid = function (locationUuid) {
                return androidDbService.getLocationByUuid(locationUuid).then(function (loginLocations) {
                    return loginLocations;
                });
            };

            var getLoggedInLocation = function () {
                var cookie = $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName);
                return getByUuid(cookie.uuid);
            };

            var getVisitLocation = function (locationUuid) {
                return $q.when({});
            };

            return {
                getAllByTag: getAllByTag,
                getLoggedInLocation: getLoggedInLocation,
                getByUuid: getByUuid,
                getVisitLocation: getVisitLocation
            };
        }]);

'use strict';

angular.module('bahmni.common.domain')
    .factory('configurationService', ['$q', 'androidDbService',
        function ($q, androidDbService) {
            var configurationFunctions = {};

            configurationFunctions.encounterConfig = function () {
                return androidDbService.getReferenceData('RegistrationConcepts');
            };

            configurationFunctions.patientConfig = function () {
                return androidDbService.getReferenceData('PatientConfig');
            };

            configurationFunctions.patientAttributesConfig = function () {
                return androidDbService.getReferenceData('PersonAttributeType');
            };

            configurationFunctions.dosageFrequencyConfig = function () {
                return androidDbService.getReferenceData('DosageFrequencyConfig');
            };

            configurationFunctions.dosageInstructionConfig = function () {
                return androidDbService.getReferenceData('DosageInstructionConfig');
            };

            configurationFunctions.stoppedOrderReasonConfig = function () {
                return androidDbService.getReferenceData('StoppedOrderReasonConfig');
            };

            configurationFunctions.consultationNoteConfig = function () {
                return androidDbService.getReferenceData('ConsultationNote');
            };

            configurationFunctions.radiologyObservationConfig = function () {
                return $q.when({});
            };

            configurationFunctions.labOrderNotesConfig = function () {
                return androidDbService.getReferenceData('LabOrderNotes');
            };

            configurationFunctions.defaultEncounterType = function () {
                return androidDbService.getReferenceData('DefaultEncounterType');
            };

            configurationFunctions.radiologyImpressionConfig = function () {
                return androidDbService.getReferenceData('RadiologyImpressionConfig');
            };

            configurationFunctions.addressLevels = function () {
                return androidDbService.getReferenceData('AddressHierarchyLevels');
            };

            configurationFunctions.allTestsAndPanelsConcept = function () {
                return androidDbService.getReferenceData('AllTestsAndPanelsConcept');
            };

            configurationFunctions.identifierTypesConfig = function () {
                return androidDbService.getReferenceData('IdentifierTypes');
            };

            configurationFunctions.genderMap = function () {
                return androidDbService.getReferenceData('Genders');
            };

            configurationFunctions.relationshipTypeMap = function () {
                return androidDbService.getReferenceData('RelationshipTypeMap');
            };

            configurationFunctions.relationshipTypeConfig = function () {
                return androidDbService.getReferenceData('RelationshipType');
            };

            configurationFunctions.loginLocationToVisitTypeMapping = function () {
                return androidDbService.getReferenceData('LoginLocationToVisitTypeMapping');
            };

            configurationFunctions.loginLocationToEncounterTypeMapping = function () {
                return androidDbService.getReferenceData('LoginLocationToEncounterTypeMapping');
            };

            var existingPromises = {};
            var configurations = {};

            var getConfigurations = function (configurationNames) {
                var configurationsPromiseDefer = $q.defer();
                var promises = [];

                configurationNames.forEach(function (configurationName) {
                    if (!existingPromises[configurationName]) {
                        existingPromises[configurationName] = configurationFunctions[configurationName]().then(function (response) {
                            configurations[configurationName] = response.data;
                        });
                        promises.push(existingPromises[configurationName]);
                    }
                });

                $q.all(promises).then(function () {
                    configurationsPromiseDefer.resolve(configurations);
                });

                return configurationsPromiseDefer.promise;
            };
            return {
                getConfigurations: getConfigurations
            };
        }]);

'use strict';

angular.module('bahmni.common.appFramework')
    .service('loadConfigService', ['androidDbService',
        function (androidDbService) {
            this.loadConfig = function (url, contextPath) {
                var configFile = url.substring(url.lastIndexOf("/") + 1);
                return androidDbService.getConfig(contextPath).then(function (config) {
                    if (config) {
                        return {"data": config.value[configFile]};
                    }
                    return {"data": {}};
                });
            };
        }]);

'use strict';

angular.module('bahmni.common.logging')
    .service('offlineLoggingService', ['$http', 'androidDbService', function ($http, androidDbService) {
        var log = function (errorUuid, failedRequest, responseStatus, stackTrace, requestPayload) {
            return androidDbService.insertLog(errorUuid, failedRequest, responseStatus, stackTrace, requestPayload);
        };

        return {
            log: log
        };
    }]);

'use strict';

angular.module('bahmni.common.offline')
    .service('appInfoStrategy', function () {
        var getVersion = function () {
            return AppUpdateService.getVersion();
        };
        return {
            getVersion: getVersion
        };
    });

'use strict';
angular.module('bahmni.common.uiHelper')
    .controller('AppUpdateController', ['$scope', 'ngDialog', 'offlineService', 'appInfoStrategy',
        function ($scope, ngDialog, offlineService, appInfoStrategy) {
            $scope.isAndroid = true;

            $scope.isUpdateAvailable = function () {
                var installedVersion = appInfoStrategy.getVersion();
                var appUpdateInfo = offlineService.getItem("appUpdateInfo");
                return appUpdateInfo && (installedVersion < _.max(appUpdateInfo.compatibleVersions));
            };

            $scope.update = function (url) {
                if (!url) {
                    url = offlineService.getItem("appUpdateInfo").latestAndroidAppUrl;
                }
                AppUpdateService.updateApp(url);
                ngDialog.close();
            };
        }]);
