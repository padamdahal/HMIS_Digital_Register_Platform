'use strict';

angular.module('bahmni.common.domain')
    .service('localeService', ['offlineDbService',
        function (offlineDbService) {
            this.allowedLocalesList = function () {
                return offlineDbService.getReferenceData('LocaleList');
            };
        }]);

'use strict';

angular.module('bahmni.common.domain')
    .factory('locationService', ['$bahmniCookieStore', 'offlineService', 'offlineDbService', '$q',
        function ($bahmniCookieStore, offlineService, offlineDbService, $q) {
            var getAllByTag = function (tags) {
                if (offlineService.getItem('LoginInformation') != null && !offlineService.getItem("allowMultipleLoginLocation")) {
                    var obj = {"data": {"results": [offlineService.getItem('LoginInformation').currentLocation]}};
                    return $q.when(obj);
                }
                return offlineDbService.getReferenceData('LoginLocations').then(function (loginLocations) {
                    if (!loginLocations) {
                        var msg = offlineService.getItem("networkError") || "Offline data not set up";
                        return $q.reject(msg);
                    }
                    return loginLocations;
                });
            };

            var getByUuid = function (locationUuid) {
                return offlineDbService.getLocationByUuid(locationUuid).then(function (loginLocations) {
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
        .factory('configurationService', ['$q', 'offlineDbService',
            function ($q, offlineDbService) {
                var configurationFunctions = {};

                configurationFunctions.encounterConfig = function () {
                    return offlineDbService.getReferenceData('RegistrationConcepts');
                };

                configurationFunctions.patientConfig = function () {
                    return offlineDbService.getReferenceData('PatientConfig');
                };

                configurationFunctions.patientAttributesConfig = function () {
                    return offlineDbService.getReferenceData('PersonAttributeType');
                };

                configurationFunctions.dosageFrequencyConfig = function () {
                    return offlineDbService.getReferenceData('DosageFrequencyConfig');
                };

                configurationFunctions.dosageInstructionConfig = function () {
                    return offlineDbService.getReferenceData('DosageInstructionConfig');
                };

                configurationFunctions.stoppedOrderReasonConfig = function () {
                    return offlineDbService.getReferenceData('StoppedOrderReasonConfig');
                };

                configurationFunctions.consultationNoteConfig = function () {
                    return offlineDbService.getReferenceData('ConsultationNote');
                };

                configurationFunctions.radiologyObservationConfig = function () {
                    return $q.when({});
                };

                configurationFunctions.labOrderNotesConfig = function () {
                    return offlineDbService.getReferenceData('LabOrderNotes');
                };

                configurationFunctions.defaultEncounterType = function () {
                    return offlineDbService.getReferenceData('DefaultEncounterType');
                };

                configurationFunctions.radiologyImpressionConfig = function () {
                    return offlineDbService.getReferenceData('RadiologyImpressionConfig');
                };

                configurationFunctions.addressLevels = function () {
                    return offlineDbService.getReferenceData('AddressHierarchyLevels');
                };

                configurationFunctions.allTestsAndPanelsConcept = function () {
                    return offlineDbService.getReferenceData('AllTestsAndPanelsConcept');
                };

                configurationFunctions.identifierTypesConfig = function () {
                    return offlineDbService.getReferenceData('IdentifierTypes');
                };

                configurationFunctions.genderMap = function () {
                    return offlineDbService.getReferenceData('Genders');
                };

                configurationFunctions.relationshipTypeMap = function () {
                    return offlineDbService.getReferenceData('RelationshipTypeMap');
                };

                configurationFunctions.relationshipTypeConfig = function () {
                    return offlineDbService.getReferenceData('RelationshipType');
                };

                configurationFunctions.loginLocationToVisitTypeMapping = function () {
                    return offlineDbService.getReferenceData('LoginLocationToVisitTypeMapping');
                };

                configurationFunctions.loginLocationToEncounterTypeMapping = function () {
                    return offlineDbService.getReferenceData('LoginLocationToEncounterTypeMapping');
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
    .service('loadConfigService', ['offlineDbService',
        function (offlineDbService) {
            this.loadConfig = function (url, contextPath) {
                var configFile = url.substring(url.lastIndexOf("/") + 1);
                return offlineDbService.getConfig(contextPath).then(function (config) {
                    if (config) {
                        return {"data": config.value[configFile]};
                    }
                    return {"data": {}};
                });
            };
        }]);

'use strict';

angular.module('bahmni.common.logging')
    .service('offlineLoggingService', ['$http', 'offlineDbService', function ($http, offlineDbService) {
        var log = function (errorUuid, failedRequest, responseStatus, stackTrace, requestPayload) {
            return offlineDbService.insertLog(errorUuid, failedRequest, responseStatus, stackTrace, requestPayload);
        };

        return {
            log: log
        };
    }]);

'use strict';

angular.module('bahmni.common.offline')
    .service('appInfoStrategy', function () {
        var getVersion = function () {
            return Bahmni.Common.Constants.bahmniConnectVersion;
        };
        return {
            getVersion: getVersion
        };
    });

'use strict';
angular.module('bahmni.common.uiHelper')
    .controller('AppUpdateController', ['$scope', 'ngDialog', 'appInfoStrategy', 'offlineService',
        function ($scope, ngDialog, appInfoStrategy, offlineService) {
            $scope.isAndroid = false;

            $scope.isUpdateAvailable = function () {
                var installedVersion = appInfoStrategy.getVersion();
                var appUpdateInfo = offlineService.getItem("appUpdateInfo");
                return appUpdateInfo && (installedVersion < _.max(appUpdateInfo.compatibleVersions));
            };

            $scope.update = function () {
                ngDialog.open({
                    template: '../common/ui-helper/views/appUpdatePopup.html',
                    className: 'test ngdialog-theme-default',
                    data: offlineService.getItem("appUpdateInfo") || {},
                    showClose: true
                });
            };
        }]);
