'use strict';

angular.module('bahmni.common.domain')
    .service('visitService', ['$q', 'offlineDbService', function ($q, offlineDbService) {
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
            return offlineDbService.getVisitByUuid(visitUuid).then(function (visit) {
                var visitSummary = visit.visitJson;
                return {data: visitSummary};
            });
        };

        this.search = function (parameters) {
            var deferred = $q.defer();
            offlineDbService.getVisitDetailsByPatientUuid(parameters.patient).then(function (visits) {
                deferred.resolve({data: {results: visits}});
            });
            return deferred.promise;
        };

        this.getVisitType = function () {
            return $q.when({data: {results: {}}});
        };
    }]);

'use strict';

angular.module('bahmni.common.domain')
    .service('offlineEncounterServiceStrategy', ['$q', '$rootScope', '$bahmniCookieStore', 'offlineDbService',
        function ($q, $rootScope, $bahmniCookieStore, offlineDbService) {
            this.getDefaultEncounterType = function () {
                return offlineDbService.getReferenceData("DefaultEncounterType");
            };

            this.getEncounterTypeBasedOnLoginLocation = function () {
                return offlineDbService.getReferenceData("LoginLocationToEncounterTypeMapping").then(function (results) {
                    var mappings = results.data.results[0].mappings;
                    return {"data": mappings};
                });
            };

            this.getEncounterTypeBasedOnProgramUuid = function (programUuid) {
                return $q.when();
            };

            this.create = function (encounterData) {
                return offlineDbService.createEncounter(encounterData);
            };

            this.delete = function (encounterUuid, reason) {
                return $q.when({"data": {"results": []}});
            };

            this.search = function (visitUuid, encounterDate) {
                return $q.when({"data": {"results": []}});
            };

            this.find = function (params) {
                return offlineDbService.getActiveEncounter(params);
            };

            this.getEncountersByPatientUuid = function (patientUuid) {
                return offlineDbService.getEncountersByPatientUuid(patientUuid);
            };
        }]);

'use strict';

angular.module('bahmni.common.patient')
    .service('patientService', ['offlineSearchDbService', '$q', 'offlineDbService', function (offlineSearchDbService, $q, offlineDbService) {
        this.getPatient = function (uuid) {
            return offlineDbService.getPatientByUuid(uuid).then(function (response) {
                response.patient.person.preferredName = response.patient.person.names[0];
                response.patient.person.preferredAddress = response.patient.person.addresses[0];
                return {"data": response.patient};
            });
        };

        this.getRelationships = function (patientUuid) {
            return $q.when({data: {}});
        };

        this.findPatients = function (params) {
            return $q.when({data: []});
        };

        this.search = function (query, offset, identifier) {
            var params = {
                q: query,
                identifier: identifier,
                startIndex: offset || 0,
                addressFieldName: Bahmni.Common.Offline.AddressFields.CITY_VILLAGE
            };
            return offlineSearchDbService.search(params);
        };

        this.getPatientContext = function (uuid, personAttributeTypes, additionalPatientIdentifiers) {
            var deferrable = $q.defer();
            var patientContextMapper = new Bahmni.PatientContextMapper();
            var patientContext;
            offlineDbService.getPatientByUuid(uuid).then(function (response) {
                if (!_.isEmpty(personAttributeTypes)) {
                    offlineDbService.getAttributeTypes().then(function (allAttributeTypes) {
                        patientContext = patientContextMapper.map(response.patient, personAttributeTypes, allAttributeTypes, additionalPatientIdentifiers);
                        deferrable.resolve({"data": patientContext});
                    });
                }
                else {
                    patientContext = patientContextMapper.map(response.patient, personAttributeTypes, [], additionalPatientIdentifiers);
                    deferrable.resolve({"data": patientContext});
                }
            });
            return deferrable.promise;
        };

        this.getRecentPatients = function (duration) {
            var params = {
                q: '',
                startIndex: 0,
                addressFieldName: Bahmni.Common.Offline.AddressFields.CITY_VILLAGE,
                duration: duration || 14
            };
            return offlineSearchDbService.search(params);
        };
    }]);

'use strict';

angular.module('bahmni.common.orders')
    .service('orderTypeService', ['offlineDbService',
        function (offlineDbService) {
            var self = this;
            self.orderTypes = [];
            self.loadAll = function () {
                return offlineDbService.getReferenceData('OrderType').then(function (orderType) {
                    self.orderTypes = orderType.data;
                    return orderType;
                });
            };

            self.getOrderTypeUuid = function (orderTypeName) {
                return _.result(_.find(self.orderTypes, {display: orderTypeName}), 'uuid');
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

angular.module('bahmni.clinical')
    .service('diseaseTemplateService', ['$q', function ($q) {
        this.getLatestDiseaseTemplates = function (patientUuid, diseaseTemplates, startDate, endDate) {
            return $q.when({"data": {}});
        };

        this.getAllDiseaseTemplateObs = function (patientUuid, diseaseName, startDate, endDate) {
            return $q.when({"data": {}});
        };

        var mapDiseaseTemplates = function (diseaseTemplates, allConceptsConfig) {
            var mappedDiseaseTemplates = [];
            diseaseTemplates.forEach(function (diseaseTemplate) {
                mappedDiseaseTemplates.push(new Bahmni.Clinical.DiseaseTemplateMapper(diseaseTemplate, allConceptsConfig));
            });
            return mappedDiseaseTemplates;
        };
    }]);

'use strict';

angular.module('bahmni.clinical')
    .service('labOrderResultService', ['offlineLabOrderResultsService', '$q', 'configurationService', function (offlineLabOrderResultsService, $q, configurationService) {
        var labOrderResultsService = offlineLabOrderResultsService;
        var allTestsAndPanelsConcept = {};
        configurationService.getConfigurations(['allTestsAndPanelsConcept']).then(function (configurations) {
            allTestsAndPanelsConcept = configurations.allTestsAndPanelsConcept.results[0];
        });
        var sanitizeData = function (labOrderResults) {
            labOrderResults.forEach(function (result) {
                result.accessionDateTime = Bahmni.Common.Util.DateUtil.parse(result.accessionDateTime);
                result.hasRange = result.minNormal && result.maxNormal;
            });
        };

        var groupByPanel = function (accessions) {
            var grouped = [];
            accessions.forEach(function (labOrders) {
                var panels = {};
                var accessionGroup = [];
                labOrders.forEach(function (labOrder) {
                    if (!labOrder.panelName) {
                        labOrder.isPanel = false;
                        labOrder.orderName = labOrder.testName;
                        accessionGroup.push(labOrder);
                    } else {
                        panels[labOrder.panelName] = panels[labOrder.panelName] || {
                            accessionDateTime: labOrder.accessionDateTime,
                            orderName: labOrder.panelName,
                            tests: [],
                            isPanel: true
                        };
                        panels[labOrder.panelName].tests.push(labOrder);
                    }
                });
                _.values(panels).forEach(function (val) {
                    accessionGroup.push(val);
                });
                grouped.push(accessionGroup);
            });
            return grouped;
        };

        var flattened = function (accessions) {
            return accessions.map(
                function (results) {
                    var flattenedResults = _(results).map(
                        function (result) {
                            return result.isPanel === true ? [result, result.tests] : result;
                        }).flattenDeep().value();
                    return flattenedResults;
                }
            );
        };

        var transformGroupSort = function (results, initialAccessionCount, latestAccessionCount) {
            var labOrderResults = results.results;
            sanitizeData(labOrderResults);

            var accessionConfig = {
                initialAccessionCount: initialAccessionCount,
                latestAccessionCount: latestAccessionCount
            };

            var tabularResult = new Bahmni.Clinical.TabularLabOrderResults(results.tabularResult, accessionConfig);
            var accessions = _.groupBy(labOrderResults, function (labOrderResult) {
                return labOrderResult.accessionUuid;
            });
            accessions = _.sortBy(accessions, function (accession) {
                return accession[0].accessionDateTime;
            });

            if (accessionConfig.initialAccessionCount || accessionConfig.latestAccessionCount) {
                var initial = _.take(accessions, accessionConfig.initialAccessionCount || 0);
                var latest = _.takeRight(accessions, accessionConfig.latestAccessionCount || 0);

                accessions = _.union(initial, latest);
            }
            accessions.reverse();
            return {
                accessions: groupByPanel(accessions),
                tabularResult: tabularResult
            };
        };
        var getAllForPatient = function (params) {
            var deferred = $q.defer();
            if (!params.patientUuid) {
                deferred.reject('patient uuid is mandatory');
            }
            labOrderResultsService.getLabOrderResultsForPatient(params).then(function (response) {
                var results = transformGroupSort(response.data, params.initialAccessionCount, params.latestAccessionCount);
                var sortedConceptSet = new Bahmni.Clinical.ConceptWeightBasedSorter(allTestsAndPanelsConcept);
                var resultObject = {
                    labAccessions: flattened(results.accessions.map(sortedConceptSet.sortTestResults)),
                    tabular: results.tabularResult
                };
                resultObject.tabular.tabularResult.orders = sortedConceptSet.sortTestResults(resultObject.tabular.tabularResult.orders);
                deferred.resolve(resultObject);
            });
            return deferred.promise;
        };

        return {
            getAllForPatient: getAllForPatient
        };
    }]);

'use strict';

angular.module('bahmni.clinical')
    .service('offlineLabOrderResultsService', ['$q', 'offlineDbService',
        function ($q, offlineDbService) {
            this.getLabOrderResultsForPatient = function (params) {
                return offlineDbService.getLabOrderResultsForPatient(params).then(function (results) {
                    return {"data": results.results};
                });
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

angular.module('bahmni.common.domain')
    .service('diagnosisService', ['$q', 'offlineEncounterServiceStrategy',
        function ($q, offlineEncounterServiceStrategy) {
            var filterAndSortDiagnosis = function (diagnoses) {
                diagnoses = _.filter(diagnoses, function (singleDiagnosis) {
                    return singleDiagnosis.revised == false;
                });
                diagnoses = _.sortBy(diagnoses, 'diagnosisDateTime').reverse();
                return diagnoses;
            };

            this.getDiagnoses = function (patientUuid, visitUuid) {
                var deferred = $q.defer();
                var diagnoses = [];
                offlineEncounterServiceStrategy.getEncountersByPatientUuid(patientUuid).then(function (results) {
                    _.each(results, function (result) {
                        if (result.encounter.bahmniDiagnoses) {
                            diagnoses = diagnoses.concat(result.encounter.bahmniDiagnoses);
                        }
                    });
                    diagnoses = filterAndSortDiagnosis(diagnoses);
                    deferred.resolve({"data": diagnoses});
                });
                return deferred.promise;
            };

            this.getAllFor = function (searchTerm) {
                return $q.when({"data": {}});
            };

            this.deleteDiagnosis = function (obsUuid) {
                return $q.when({"data": {}});
            };

            this.getDiagnosisConceptSet = function () {
                return $q.when({"data": {}});
            };

            this.getPastAndCurrentDiagnoses = function (patientUuid, encounterUuid) {
                return $q.when({"data": {}});
            };

            this.populateDiagnosisInformation = function (patientUuid, consultation) {
                consultation.savedDiagnosesFromCurrentEncounter = [];
                consultation.pastDiagnoses = [];
                return $q.when(consultation);
            };
        }]);

'use strict';

angular.module('bahmni.common.domain')
    .service('observationsServiceStrategy', ['$q', 'offlineDbService', function ($q, offlineDbService) {
        this.fetch = function (patientUuid, numberOfVisits, params) {
            var deffered = $q.defer();
            offlineDbService.getVisitsByPatientUuid(patientUuid, numberOfVisits).then(function (visitUuids) {
                var mappedVisitUuids = _.map(visitUuids, function (visitUuid) {
                    return visitUuid.uuid;
                });
                var obsMapper = new Bahmni.Common.Domain.ObservationMapper();
                params.visitUuids = params.visitUuid ? [params.visitUuid] : (mappedVisitUuids || []);
                offlineDbService.getObservationsFor(params).then(function (obs) {
                    var mappedObs = _.map(obs, function (ob) {
                        return obsMapper.preProcessObs(ob.observation);
                    });
                    deffered.resolve({data: mappedObs});
                });
            });
            return deffered.promise;
        };

        this.fetchObsForVisit = function (params) {
            var deferred = $q.defer();

            var obsMapper = new Bahmni.Common.Domain.ObservationMapper();
            offlineDbService.getObservationsForVisit(params.visitUuid).then(function (obs) {
                var mappedObs = _.map(obs, function (ob) {
                    return ob.observation;
                });
                deferred.resolve({data: mappedObs});
            });
            return deferred.promise;
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

        this.getAllParentsInHierarchy = function (conceptName) {
            var deferred = $q.defer();
            offlineDbService.getAllParentsInHierarchy(conceptName).then(function (rootConcept) {
                deferred.resolve({data: rootConcept});
            });
            return deferred.promise;
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

Bahmni.Common.Util.DateTimeFormatter = {

    getDateWithoutTime: function (datetime) {
        return datetime ? moment(datetime).format("YYYY-MM-DD") : null;
    }
};

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

angular.module('bahmni.clinical')
    .factory('treatmentService', ['$q', 'appService', 'offlineDbService', 'offlineService', 'androidDbService',
        function ($q, appService, offlineDbService, offlineService, androidDbService) {
            if (offlineService.isAndroidApp()) {
                offlineDbService = androidDbService;
            }

            var createDrugOrder = function (drugOrder) {
                return Bahmni.Clinical.DrugOrder.create(drugOrder);
            };

            var getPrescribedAndActiveDrugOrders = function (patientUuid, numberOfVisits, getOtherActive,
                                                         visitUuids, startDate, endDate, getEffectiveOrdersOnly) {
                var params = {
                    patientUuid: patientUuid,
                    numberOfVisits: numberOfVisits,
                    getOtherActive: getOtherActive,
                    visitUuids: visitUuids,
                    startDate: startDate,
                    endDate: endDate,
                    getEffectiveOrdersOnly: getEffectiveOrdersOnly
                };
                var deferred = $q.defer();
                var visitDrugOrders = [];
                offlineDbService.getVisitsByPatientUuid(patientUuid, numberOfVisits).then(function (visits) {
                    var mappedVisitUuids = _.map(visits, function (visit) {
                        return visit.uuid;
                    });
                    if (mappedVisitUuids && mappedVisitUuids.length === 0) {
                        deferred.resolve({"data": {}});
                    }
                    params.visitUuids = mappedVisitUuids || [];
                    offlineDbService.getPrescribedAndActiveDrugOrders(params).then(function (results) {
                        _.each(results, function (result) {
                            var drugOrders = result.encounter.drugOrders ? result.encounter.drugOrders : [];
                            _.each(visits, function (visit) {
                                if (result.encounter.visitUuid === visit.uuid) {
                                    result.encounter.visit = {startDateTime: visit.startDatetime};
                                }
                            });
                            _.each(drugOrders, function (drugOrder) {
                                drugOrder.provider = result.encounter.providers[0];
                                drugOrder.creatorName = result.encounter.providers[0].name;
                                drugOrder.visit = result.encounter.visit;
                            });
                            visitDrugOrders = visitDrugOrders.concat(drugOrders);
                        });
                        var uuids = [];
                        _.each(visitDrugOrders, function (visitDrugOrder) {
                            if (visitDrugOrder.previousOrderUuid) {
                                uuids.push(visitDrugOrder.previousOrderUuid);
                            }
                        });

                        for (var index = 0; index < visitDrugOrders.length; index++) {
                            for (var indx = 0; indx < uuids.length; indx++) {
                                if (uuids[indx] === visitDrugOrders[index].uuid) {
                                    visitDrugOrders.splice(index, 1);
                                }
                            }
                        }

                        var response = {visitDrugOrders: visitDrugOrders};
                        for (var key in response) {
                            response[key] = response[key].map(createDrugOrder);
                        }
                        deferred.resolve({"data": response});
                    });
                });
                return deferred.promise;
            };

            var getConfig = function () {
                return offlineDbService.getReferenceData('DrugOrderConfig');
            };

            var getProgramConfig = function () {
                var programConfig = appService.getAppDescriptor() ? appService.getAppDescriptor().getConfigValue("program") || {} : {};
                return programConfig;
            };

            var getActiveDrugOrders = function () {
                return $q.when({"data": {}});
            };

            var getPrescribedDrugOrders = function () {
                return $q.when({"data": {}});
            };

            var getNonCodedDrugConcept = function () {
                var deferred = $q.defer();
                offlineDbService.getReferenceData('NonCodedDrugConcept').then(function (response) {
                    deferred.resolve(response.data);
                });
                return deferred.promise;
            };

            var getAllDrugOrdersFor = function () {
                return $q.when({"data": {}});
            };

            var voidDrugOrder = function (drugOrder) {
                return $q.when({"data": {}});
            };

            return {
                getActiveDrugOrders: getActiveDrugOrders,
                getConfig: getConfig,
                getPrescribedDrugOrders: getPrescribedDrugOrders,
                getPrescribedAndActiveDrugOrders: getPrescribedAndActiveDrugOrders,
                getNonCodedDrugConcept: getNonCodedDrugConcept,
                getAllDrugOrdersFor: getAllDrugOrdersFor,
                voidDrugOrder: voidDrugOrder
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
