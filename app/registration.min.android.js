'use strict';

angular.module('bahmni.registration')
    .factory('patientServiceStrategy', ['$q', 'offlinePatientServiceStrategy', 'eventQueue', '$rootScope', 'offlineService', 'offlineDbService', 'androidDbService',
        function ($q, offlinePatientServiceStrategy, eventQueue, $rootScope, offlineService, offlineDbService, androidDbService) {
            if (offlineService.isOfflineApp()) {
                if (offlineService.isAndroidApp()) {
                    offlineDbService = androidDbService;
                }
            }
            var search = function (config) {
                return offlinePatientServiceStrategy.search(config).then(function (results) {
                    return results.data;
                });
            };

            var get = function (uuid) {
                return offlinePatientServiceStrategy.get(uuid).then(function (data) {
                    var patientData = JSON.parse(JSON.stringify(data));
                    patientData.patient.person.preferredName = patientData.patient.person.names[0];
                    patientData.patient.person.preferredAddress = patientData.patient.person.addresses[0];
                    return offlinePatientServiceStrategy.getAttributeTypes().then(function (attributeTypes) {
                        mapAttributesToGetFormat(patientData.patient.person.attributes, attributeTypes);
                        return patientData;
                    });
                });
            };

            var create = function (patient) {
                var allIdentifiers = _.concat(patient.extraIdentifiers, patient.primaryIdentifier);
                var data = new Bahmni.Registration.CreatePatientRequestMapper(moment()).mapFromPatient($rootScope.patientConfiguration.attributeTypes, patient);
                var extraIdentifiersForSearch = {};
                patient.extraIdentifiers.forEach(function (extraIdentifier) {
                    var name = extraIdentifier.identifierType.name || extraIdentifier.identifierType.display;
                    extraIdentifiersForSearch[name] = extraIdentifier.identifier;
                });
                data.patient.identifiers = allIdentifiers;
                angular.forEach(data.patient.identifiers, function (identifier) {
                    identifier.primaryIdentifier = patient.primaryIdentifier.identifier;
                    identifier.extraIdentifiers = extraIdentifiersForSearch;
                });
                return createWithOutMapping(data);
            };

            var createWithOutMapping = function (data) {
                data.patient.identifiers = _.filter(data.patient.identifiers, function (identifier) {
                    return !_.isEmpty(identifier.identifierType.identifierSources) || (identifier.identifier !== undefined);
                });

                data.patient.person.birthtime = data.patient.person.birthtime ? moment(data.patient.person.birthtime).format("YYYY-MM-DDTHH:mm:ss.SSSZZ") : null;
                data.patient.person.auditInfo = {dateCreated: moment(data.patient.person.personDateCreated).format() || moment().format()};
                if ($rootScope.currentProvider) {
                    data.patient.person.auditInfo = data.patient.person.auditInfo || {};
                    data.patient.person.auditInfo.creator = $rootScope.currentProvider;
                    data.patient.auditInfo = data.patient.auditInfo || {};
                    data.patient.auditInfo.creator = $rootScope.currentProvider;
                }
                data.patient.person.personDateCreated = undefined;
                var event = {};
                if (!data.patient.person.addresses[0].uuid) {
                    _.each(data.patient.person.addresses, function (address) {
                        address.uuid = Bahmni.Common.Offline.UUID.generateUuid();
                    });
                }
                if (!data.patient.uuid) {
                    data.patient.person.uuid = Bahmni.Common.Offline.UUID.generateUuid();
                    _.each(data.patient.person.names, function (name) {
                        name.uuid = Bahmni.Common.Offline.UUID.generateUuid();
                    });
                    data.patient.uuid = data.patient.person.uuid;
                    event.url = Bahmni.Registration.Constants.baseOpenMRSRESTURL + "/bahmnicore/patientprofile/";
                } else {
                    event.url = Bahmni.Registration.Constants.baseOpenMRSRESTURL + "/bahmnicore/patientprofile/" + data.patient.uuid;
                }
                event.dbName = offlineDbService.getCurrentDbName();
                event.patientUuid = data.patient.uuid;
                return offlinePatientServiceStrategy.create(data).then(function (response) {
                    eventQueue.addToEventQueue(event);
                    return response;
                }, function (response) {
                    return $q.reject(response);
                });
            };

            var update = function (patient, openMRSPatient, attributeTypes) {
                var data = new Bahmni.Registration.CreatePatientRequestMapper(moment()).mapFromPatient(attributeTypes, patient);
                data.patient.identifiers = _.concat(patient.extraIdentifiers, patient.primaryIdentifier);
                var openmrsIdentifier = openMRSPatient.identifiers;
                var extraIdentifiersForSearch = {};
                patient.extraIdentifiers.forEach(function (extraIdentifier) {
                    var name = extraIdentifier.identifierType.name || extraIdentifier.identifierType.display;
                    extraIdentifiersForSearch[name] = extraIdentifier.identifier;
                });
                angular.forEach(data.patient.identifiers, function (identifier) {
                    var matchedOpenMRSIdentifier = _.find(openmrsIdentifier, {'identifierType': {'uuid': identifier.identifierType.uuid}});
                    identifier.selectedIdentifierSource = matchedOpenMRSIdentifier && matchedOpenMRSIdentifier.selectedIdentifierSource;
                    identifier.primaryIdentifier = patient.primaryIdentifier.identifier;
                    identifier.extraIdentifiers = extraIdentifiersForSearch;
                });
                data.patient.person.names[0].uuid = openMRSPatient.person.names[0].uuid;
                return offlinePatientServiceStrategy.deletePatientData(data.patient.uuid).then(function () {
                    return createWithOutMapping(data).then(function (result) {
                        var patientData = JSON.parse(JSON.stringify(result.data));
                        patientData.patient.person.preferredName = data.patient.person.names[0];
                        patientData.patient.person.preferredAddress = data.patient.person.addresses[0];
                        mapAttributesToGetFormat(patientData.patient.person.attributes, attributeTypes);
                        return $q.when({"data": patientData});
                    });
                });
            };

            var mapAttributesToGetFormat = function (attributes, attributeTypes) {
                angular.forEach(attributes, function (attribute) {
                    if (!attribute.voided) {
                        var foundAttribute = _.find(attributeTypes, function (attributeType) {
                            return attributeType.uuid === attribute.attributeType.uuid;
                        });
                        if (foundAttribute && foundAttribute.format) {
                            if (foundAttribute.format === "java.lang.Integer" || foundAttribute.format === "java.lang.Float") {
                                attribute.value = parseFloat(attribute.value);
                            } else if (foundAttribute.format === "java.lang.Boolean") {
                                attribute.value = (attribute.value === true || attribute.value === 'true');
                            } else if (foundAttribute.format === "org.openmrs.Concept") {
                                var value = attribute.value;
                                attribute.value = {display: value, uuid: attribute.hydratedObject};
                            }
                        }
                    }
                });
            };

            var generateIdentifier = function () {
                return $q.when({});
            };

            return {
                search: search,
                get: get,
                create: create,
                update: update,
                generateIdentifier: generateIdentifier
            };
        }]);

'use strict';

angular.module('bahmni.common.domain')
    .service('observationsService', ['$q', 'observationsServiceStrategy', function ($q, observationsServiceStrategy) {
        var fetchAndFilterObservations = function (conceptNames, index, params, listOfObservations) {
            return observationsServiceStrategy.getAllParentsInHierarchy(conceptNames[index]).then(function (result) {
                params.conceptNames = result.data;
                return observationsServiceStrategy.fetch(params.patientUuid, params.numberOfVisits, params).then(function (results) {
                    var acutalObs = filterObservation(results.data, conceptNames[index]);
                    listOfObservations = listOfObservations.concat(acutalObs);
                    index++;
                    if (index < conceptNames.length) {
                        return fetchAndFilterObservations(conceptNames, index, params, listOfObservations);
                    } else {
                        return $q.when(listOfObservations);
                    }
                });
            });
        };

        var fetchAndFilterObservationsForVisit = function (params) {
            if (params.conceptNames) {
                return fetchAndFilterObservations(params.conceptNames, 0, params, []);
            } else {
                return observationsServiceStrategy.fetchObsForVisit(params).then(function (results) {
                    return $q.when(results.data);
                }); }
        };

        var getObservationByIterateOverGroupMembers = function (obs, conceptName, results) {
            if (obs.concept.name === conceptName && !obs.voided) {
                results.push(obs);
            }
            _.each(obs.groupMembers, function (groupMember, index) {
                if (groupMember.voided) {
                    delete obs.groupMembers[index];
                } else if (groupMember.concept.name === conceptName) {
                    results.push(groupMember);
                } else {
                    getObservationByIterateOverGroupMembers(groupMember, conceptName, results);
                }
            });
            _.remove(obs.groupMembers, function (member) {
                return member == undefined;
            });
        };

        var filterObservation = function (obsArray, conceptName) {
            var actualObs = [];
            _.each(obsArray, function (obs) {
                getObservationByIterateOverGroupMembers(obs, conceptName, actualObs);
            });
            return actualObs;
        };

        this.fetch = function (patientUuid, conceptNames, scope, numberOfVisits, visitUuid, obsIgnoreList, filterObsWithOrders, patientProgramUuid) {
            var params = {};
            if (obsIgnoreList) {
                params.obsIgnoreList = obsIgnoreList;
            }
            if (filterObsWithOrders != null) {
                params.filterObsWithOrders = filterObsWithOrders;
            }

            if (visitUuid) {
                params.visitUuid = visitUuid;
                params.patientUuid = patientUuid;
                params.scope = scope;
                params.conceptNames = conceptNames;
                return fetchAndFilterObservationsForVisit(params).then(function (results) {
                    return {"data": results};
                });
            } else {
                params.patientUuid = patientUuid;
                params.numberOfVisits = numberOfVisits;
                params.scope = scope;
                params.patientProgramUuid = patientProgramUuid;
            }

            var listOfObservations = [];
            var index = 0;
            return fetchAndFilterObservations(conceptNames, index, params, listOfObservations).then(function (results) {
                return {"data": results};
            });
        };

        this.getByUuid = function (observationUuid) {
            return $q.when({"data": {"results": []}});
        };

        this.fetchForEncounter = function (encounterUuid, conceptNames) {
            return $q.when({"data": {"results": []}});
        };

        this.fetchForPatientProgram = function (patientProgramUuid, conceptNames, scope) {
            return $q.when({"data": {"results": []}});
        };

        this.getObsRelationship = function (targetObsUuid) {
            return $q.when({"data": {"results": []}});
        };

        this.getObsInFlowSheet = function (patientUuid, conceptSet, groupByConcept, conceptNames,
                                           numberOfVisits, initialCount, latestCount, groovyExtension,
                                           startDate, endDate, patientProgramUuid) {
            return $q.when({"data": {"results": []}});
        };
    }]);

'use strict';

angular.module('bahmni.common.domain')
    .service('encounterService', ['$q', '$rootScope', '$bahmniCookieStore', 'offlineEncounterServiceStrategy', 'eventQueue', 'offlineService', 'offlineDbService', 'androidDbService',
        function ($q, $rootScope, $bahmniCookieStore, offlineEncounterServiceStrategy, eventQueue, offlineService, offlineDbService, androidDbService) {
            var offlineEncounterService = offlineEncounterServiceStrategy;
            if (offlineService.isOfflineApp()) {
                if (offlineService.isAndroidApp()) {
                    offlineDbService = androidDbService;
                }
            }
            this.buildEncounter = function (encounter) {
                encounter.observations = encounter.observations || [];
                encounter.providers = encounter.providers || [];

                var providerData = $bahmniCookieStore.get(Bahmni.Common.Constants.grantProviderAccessDataCookieName);
                if (_.isEmpty(encounter.providers)) {
                    if (providerData && providerData.uuid) {
                        encounter.providers.push({"uuid": providerData.uuid});
                    } else if ($rootScope.currentProvider && $rootScope.currentProvider.uuid) {
                        encounter.providers.push($rootScope.currentProvider);
                    }
                }
                encounter.observations.forEach(function (obs) {
                    obs.uuid = obs.uuid || Bahmni.Common.Offline.UUID.generateUuid();
                    obs.encounterUuid = encounter.encounterUuid;
                    obs.encounterDateTime = encounter.encounterDateTime;
                    obs.observationDateTime = encounter.observationDateTime || new Date();
                    obs.providers = encounter.providers;
                    obs.creatorName = encounter.creatorName;
                    stripExtraInfo(obs);
                });
                return encounter;
            };

            var getDefaultEncounterType = function () {
                var deferred = $q.defer();
                offlineEncounterService.getDefaultEncounterType().then(function (response) {
                    deferred.resolve(response);
                });
                return deferred.promise;
            };

            var getEncounterTypeBasedOnLoginLocation = function () {
                return offlineEncounterService.getEncounterTypeBasedOnLoginLocation();
            };

            var getEncounterTypeBasedOnProgramUuid = function (programUuid) {
                return offlineEncounterService.getEncounterTypeBasedOnProgramUuid();
            };

            var getDefaultEncounterTypeIfMappingNotFound = function (mapping) {
                var encounterType = mapping;
                if (_.isEmpty(encounterType)) {
                    encounterType = getDefaultEncounterType();
                }
                return encounterType;
            };

            this.getEncounterType = function (programUuid, loginLocationUuid) {
                if (programUuid) {
                    return getEncounterTypeBasedOnProgramUuid(programUuid).then(function (response) {
                        return getDefaultEncounterTypeIfMappingNotFound(response);
                    });
                } else if (loginLocationUuid) {
                    return getEncounterTypeBasedOnLoginLocation().then(function (response) {
                        return getDefaultEncounterTypeIfMappingNotFound(response.data);
                    });
                } else {
                    return getDefaultEncounterType();
                }
            };

            this.create = function (encounterData) {
                encounterData.encounterUuid = encounterData.encounterUuid || Bahmni.Common.Offline.UUID.generateUuid();
                encounterData.visitUuid = encounterData.visitUuid || null;
                encounterData.encounterDateTime = encounterData.encounterDateTime || Bahmni.Common.Util.DateUtil.now();
                encounterData.visitType = encounterData.visitType || 'Field';
                encounterData.encounterTypeUuid = null;
                this.buildEncounter(encounterData);
                return getDefaultEncounterType().then(function (encounterType) {
                    encounterData.encounterType = encounterData.encounterType || encounterType.data;
                    return encounterData;
                }).then(function (encounterData) {
                    return offlineEncounterService.create(encounterData);
                }).then(function (result) {
                    var event = {type: "encounter", encounterUuid: result.data.encounterUuid, dbName: offlineDbService.getCurrentDbName() };
                    eventQueue.addToEventQueue(event);
                    return $q.when({data: encounterData});
                });
            };

            this.delete = function (encounterUuid, reason) {
                return offlineEncounterService.delete(encounterUuid, reason);
            };

            var stripExtraInfo = function (obs) {
                delete obs.isObservation;
                delete obs.isObservationNode;
                obs.concept = {uuid: obs.concept.uuid, name: obs.concept.name, dataType: obs.concept.dataType || obs.concept.datatype, conceptClass: obs.concept.conceptClass, hiNormal: obs.concept.hiNormal, lowNormal: obs.concept.lowNormal, units: obs.concept.units};
                obs.groupMembers = obs.groupMembers || [];
                obs.groupMembers.forEach(function (groupMember) {
                    groupMember.uuid = groupMember.uuid || Bahmni.Common.Offline.UUID.generateUuid();
                    groupMember.encounterDateTime = obs.encounterDateTime;
                    groupMember.observationDateTime = obs.observationDateTime;
                    groupMember.providers = obs.providers;
                    groupMember.creatorName = obs.creatorName;
                    stripExtraInfo(groupMember);
                });
            };

            var searchWithoutEncounterDate = function (visitUuid) {
                return $q.when({"data": {"results": []}});
            };

            this.search = function (visitUuid, encounterDate) {
                return offlineEncounterService.search(visitUuid, encounterDate);
            };

            this.find = function (params) {
                return offlineEncounterService.find(params).then(function (results) {
                    if (results && results.encounter) {
                        return {data: results.encounter};
                    } else {
                        return {"data": {
                            "bahmniDiagnoses": [],
                            "observations": [],
                            "accessionNotes": [],
                            "encounterType": null,
                            "visitType": null,
                            "patientId": null,
                            "reason": null,
                            "orders": [],
                            "providers": [],
                            "drugOrders": [],
                            "patientProgramUuid": null,
                            "visitUuid": null,
                            "patientUuid": null,
                            "encounterDateTime": null,
                            "associatedToPatientProgram": false,
                            "encounterUuid": null,
                            "visitTypeUuid": null,
                            "encounterTypeUuid": null,
                            "locationUuid": null,
                            "disposition": null,
                            "locationName": null,
                            "context": {},
                            "extensions": {}
                        }}; }
                });
            };

            this.findByEncounterUuid = function (encounterUuid) {
                return $q.when({"data": {"results": []}});
            };

            this.getEncountersForEncounterType = function (patientUuid, encounterTypeUuid) {
                return $q.when({"data": {"results": []}});
            };

            this.getDigitized = function (patientUuid) {
                return $q.when({"data": {"results": []}});
            };

            this.discharge = function (encounterData) {
                return $q.when({"data": {"results": []}});
            };
        }]);


'use strict';

angular.module('bahmni.common.conceptSet')
    .factory('conceptSetService', ['$http', '$q', '$bahmniTranslate', 'offlineDbService', 'androidDbService', 'offlineService', function ($http, $q, $bahmniTranslate, offlineDbService, androidDbService, offlineService) {
        if (offlineService.isAndroidApp()) {
            offlineDbService = androidDbService;
        }
        var getConcept = function (params) {
            params['locale'] = params['locale'] || $bahmniTranslate.use();
            return offlineDbService.getConceptByName(params.name);
        };

        return {
            getConcept: getConcept
        };
    }]);

'use strict';

angular.module('bahmni.registration')
    .service('offlinePatientServiceStrategy', ['$http', '$q', 'androidDbService', function ($http, $q, androidDbService) {
        var search = function (config) {
            return $q.when(JSON.parse(AndroidOfflineService.search(JSON.stringify(config.params))));
        };

        var getByUuid = function (uuid) {
            return androidDbService.getPatientByUuid(uuid);
        };

        var create = function (data) {
            return androidDbService.createPatient(data);
        };

        var deletePatientData = function (patientUuid) {
            return androidDbService.deletePatientData(patientUuid);
        };

        var getAttributeTypes = function () {
            return androidDbService.getAttributeTypes();
        };

        return {
            search: search,
            get: getByUuid,
            create: create,
            deletePatientData: deletePatientData,
            getAttributeTypes: getAttributeTypes
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

angular.module('bahmni.common.domain')
    .service('visitService', ['$q', 'androidDbService', function ($q, androidDbService) {
        this.getVisit = function (uuid, params) {
            return $q.when({data: {results: {}}});
        };

        this.endVisit = function (visitUuid) {
            return $q.when({data: {results: {}}});
        };

        this.createVisit = function (visitDetails) {
            return $q.when({data: {results: {}}});
        };

        this.updateVisit = function (visitUuid, attributes) {
            return $q.when({data: {results: {}}});
        };

        this.getVisitSummary = function (visitUuid) {
            return androidDbService.getVisitByUuid(visitUuid).then(function (visit) {
                var visitSummary = visit.visitJson;

                if (visitSummary.visitType) {
                    visitSummary.visitType = visitSummary.visitType.display;
                }

                return {data: visitSummary};
            });
        };

        this.search = function (parameters) {
            return androidDbService.getVisitDetailsByPatientUuid(parameters.patient).then(function (visits) {
                return {data: {results: _.map(visits, function (visitStr) {
                    return JSON.parse(visitStr);
                })}};
            });
        };

        this.getVisitType = function () {
            return $q.when({data: {results: {}}});
        };
    }]);

'use strict';

Bahmni.Common.Util.DateTimeFormatter = {

    getDateWithoutTime: function (date) {
        return date ? moment(date).format("MM-DD-YYYY") : null;
    }
};

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

angular.module('bahmni.common.domain')
    .service('offlineEncounterServiceStrategy', ['$q', '$rootScope', '$bahmniCookieStore', 'androidDbService',
        function ($q, $rootScope, $bahmniCookieStore, androidDbService) {
            this.getDefaultEncounterType = function () {
                return androidDbService.getReferenceData("DefaultEncounterType");
            };

            this.getEncounterTypeBasedOnLoginLocation = function () {
                return androidDbService.getReferenceData("LoginLocationToEncounterTypeMapping").then(function (results) {
                    var mappings = results.data.results[0].mappings;
                    return {"data": mappings};
                });
            };

            this.getEncounterTypeBasedOnProgramUuid = function (programUuid) {
                return $q.when();
            };

            this.create = function (encounterData) {
                return androidDbService.createEncounter(encounterData);
            };

            this.delete = function (encounterUuid, reason) {
                return $q.when({"data": {"results": []}});
            };

            this.search = function (visitUuid, encounterDate) {
                return $q.when({"data": {"results": []}});
            };

            this.find = function (params) {
                return androidDbService.getActiveEncounter(params);
            };

            this.getEncountersByPatientUuid = function (patientUuid) {
                return androidDbService.getEncountersByPatientUuid(patientUuid);
            };
        }]);

'use strict';

angular.module('bahmni.common.domain')
    .service('observationsServiceStrategy', ['$q', 'androidDbService', function ($q, androidDbService) {
        this.fetch = function (patientUuid, numberOfVisits, params) {
            var deffered = $q.defer();
            androidDbService.getVisitsByPatientUuid(patientUuid, numberOfVisits).then(function (visitUuids) {
                var mappedVisitUuids = _.map(visitUuids, function (visitUuid) {
                    return visitUuid.uuid;
                });
                var obsMapper = new Bahmni.Common.Domain.ObservationMapper();
                params.visitUuids = params.visitUuid ? [params.visitUuid] : (mappedVisitUuids || []);
                androidDbService.getObservationsFor(params).then(function (obs) {
                    var mappedObs = _.map(obs, function (ob) {
                        return obsMapper.preProcessObs(ob.observation);
                    });
                    deffered.resolve({data: mappedObs});
                });
            });
            return deffered.promise;
        };

        this.getByUuid = function (observationUuid) {
            return $q.when({"data": {"results": []}});
        };

        this.fetchForEncounter = function (encounterUuid, conceptNames) {
            return $q.when({"data": {"results": []}});
        };

        this.fetchForPatientProgram = function (patientProgramUuid, conceptNames, scope) {
            return $q.when({"data": {"results": []}});
        };

        this.getObsRelationship = function (targetObsUuid) {
            return $q.when({"data": {"results": []}});
        };

        this.getObsInFlowSheet = function (patientUuid, conceptSet, groupByConcept, conceptNames,
                                           numberOfVisits, initialCount, latestCount, groovyExtension,
                                           startDate, endDate, patientProgramUuid) {
            return $q.when({"data": {"results": []}});
        };

        this.fetchObsForVisit = function (params) {
            var deferred = $q.defer();

            var obsMapper = new Bahmni.Common.Domain.ObservationMapper();
            androidDbService.getObservationsForVisit(params.visitUuid).then(function (obs) {
                var mappedObs = _.map(obs, function (ob) {
                    return obsMapper.preProcessObs(ob.observation);
                });
                deferred.resolve({data: mappedObs});
            });
            return deferred.promise;
        };

        this.getAllParentsInHierarchy = function (conceptName) {
            var deferred = $q.defer();
            androidDbService.getAllParentsInHierarchy(conceptName).then(function (results) {
                deferred.resolve({data: results});
            });
            return deferred.promise;
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
