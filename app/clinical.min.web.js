'use strict';

angular.module('bahmni.common.domain')
    .service('visitService', ['$http', function ($http) {
        this.getVisit = function (uuid, params) {
            var parameters = params ? params : "custom:(uuid,visitId,visitType,patient,encounters:(uuid,encounterType,voided,orders:(uuid,orderType,voided,concept:(uuid,set,name),),obs:(uuid,value,concept,obsDatetime,groupMembers:(uuid,concept:(uuid,name),obsDatetime,value:(uuid,name),groupMembers:(uuid,concept:(uuid,name),value:(uuid,name),groupMembers:(uuid,concept:(uuid,name),value:(uuid,name)))))))";
            return $http.get(Bahmni.Common.Constants.visitUrl + '/' + uuid,
                {
                    params: {
                        v: parameters
                    }
                }
            );
        };

        this.endVisit = function (visitUuid) {
            return $http.post(Bahmni.Common.Constants.endVisitUrl + '?visitUuid=' + visitUuid, {
                withCredentials: true
            });
        };

        this.endVisitAndCreateEncounter = function (visitUuid, bahmniEncounterTransaction) {
            return $http.post(Bahmni.Common.Constants.endVisitAndCreateEncounterUrl + '?visitUuid=' + visitUuid, bahmniEncounterTransaction, {
                withCredentials: true
            });
        };

        this.updateVisit = function (visitUuid, attributes) {
            return $http.post(Bahmni.Common.Constants.visitUrl + '/' + visitUuid, attributes, {
                withCredentials: true
            });
        };

        this.createVisit = function (visitDetails) {
            return $http.post(Bahmni.Common.Constants.visitUrl, visitDetails, {
                withCredentials: true
            });
        };

        this.getVisitSummary = function (visitUuid) {
            return $http.get(Bahmni.Common.Constants.visitSummaryUrl,
                {
                    params: {
                        visitUuid: visitUuid
                    },
                    withCredentials: true
                }
            );
        };

        this.search = function (parameters) {
            return $http.get(Bahmni.Common.Constants.visitUrl, {
                params: parameters,
                withCredentials: true
            });
        };

        this.getVisitType = function () {
            return $http.get(Bahmni.Common.Constants.visitTypeUrl, {
                withCredentials: true
            });
        };
    }]);

'use strict';

angular.module('bahmni.common.domain')
    .service('diagnosisService', ['$http', '$rootScope', function ($http, $rootScope) {
        var self = this;
        this.getAllFor = function (searchTerm) {
            var url = Bahmni.Common.Constants.emrapiConceptUrl;
            return $http.get(url, {
                params: {term: searchTerm, limit: 20}
            });
        };

        this.getDiagnoses = function (patientUuid, visitUuid) {
            var url = Bahmni.Common.Constants.bahmniDiagnosisUrl;
            return $http.get(url, {
                params: { patientUuid: patientUuid, visitUuid: visitUuid}
            });
        };

        this.deleteDiagnosis = function (obsUuid) {
            var url = Bahmni.Common.Constants.bahmniDeleteDiagnosisUrl;
            return $http.get(url, {
                params: {obsUuid: obsUuid}
            });
        };

        this.getDiagnosisConceptSet = function () {
            return $http.get(Bahmni.Common.Constants.conceptUrl, {
                method: "GET",
                params: {
                    v: 'custom:(uuid,name,setMembers)',
                    code: Bahmni.Common.Constants.diagnosisConceptSet,
                    source: Bahmni.Common.Constants.emrapiConceptMappingSource
                },
                withCredentials: true
            });
        };

        this.getPastAndCurrentDiagnoses = function (patientUuid, encounterUuid) {
            return self.getDiagnoses(patientUuid).then(function (response) {
                var diagnosisMapper = new Bahmni.DiagnosisMapper($rootScope.diagnosisStatus);
                var allDiagnoses = diagnosisMapper.mapDiagnoses(response.data);
                var pastDiagnoses = diagnosisMapper.mapPastDiagnosis(allDiagnoses, encounterUuid);
                var savedDiagnosesFromCurrentEncounter = diagnosisMapper.mapSavedDiagnosesFromCurrentEncounter(allDiagnoses, encounterUuid);
                return {
                    "pastDiagnoses": pastDiagnoses,
                    "savedDiagnosesFromCurrentEncounter": savedDiagnosesFromCurrentEncounter
                };
            });
        };

        this.populateDiagnosisInformation = function (patientUuid, consultation) {
            return this.getPastAndCurrentDiagnoses(patientUuid, consultation.encounterUuid).then(function (diagnosis) {
                consultation.pastDiagnoses = diagnosis.pastDiagnoses;
                consultation.savedDiagnosesFromCurrentEncounter = diagnosis.savedDiagnosesFromCurrentEncounter;
                return consultation;
            });
        };
    }]);

'use strict';

angular.module('bahmni.common.orders')
    .service('orderTypeService', ['$http', function ($http) {
        var self = this;
        self.orderTypes = [];
        self.loadAll = function () {
            return $http.get("/openmrs/ws/rest/v1/ordertype", {
                params: {v: "custom:(uuid,display,conceptClasses:(uuid,display,name))"}
            }).then(function (response) {
                self.orderTypes = response.data.results;
                return self.orderTypes;
            });
        };

        self.getOrderTypeUuid = function (orderTypeName) {
            return _.result(_.find(self.orderTypes, {display: orderTypeName}), 'uuid');
        };
    }]);

'use strict';

angular.module('bahmni.common.patient')
    .service('patientService', ['$http', 'sessionService', function ($http, sessionService) {
        this.getPatient = function (uuid) {
            var patient = $http.get(Bahmni.Common.Constants.openmrsUrl + "/ws/rest/v1/patient/" + uuid, {
                method: "GET",
                params: {v: "full"},
                withCredentials: true
            });
            return patient;
        };

        this.getRelationships = function (patientUuid) {
            return $http.get(Bahmni.Common.Constants.openmrsUrl + "/ws/rest/v1/relationship", {
                method: "GET",
                params: {person: patientUuid, v: "full"},
                withCredentials: true
            });
        };

        this.findPatients = function (params) {
            return $http.get(Bahmni.Common.Constants.sqlUrl, {
                method: "GET",
                params: params,
                withCredentials: true
            });
        };

        this.search = function (query, offset, identifier) {
            offset = offset || 0;
            return $http.get(Bahmni.Common.Constants.bahmniSearchUrl + "/patient", {
                method: "GET",
                params: {
                    q: query,
                    startIndex: offset,
                    identifier: identifier,
                    loginLocationUuid: sessionService.getLoginLocationUuid()
                },
                withCredentials: true
            });
        };

        this.getPatientContext = function (patientUuid, programUuid, personAttributes, programAttributes, patientIdentifiers) {
            return $http.get('/openmrs/ws/rest/v1/bahmnicore/patientcontext', {
                params: {
                    patientUuid: patientUuid,
                    programUuid: programUuid,
                    personAttributes: personAttributes,
                    programAttributes: programAttributes,
                    patientIdentifiers: patientIdentifiers
                },
                withCredentials: true
            });
        };
    }]);

'use strict';

angular.module('bahmni.common.domain')
    .factory('locationService', ['$http', '$bahmniCookieStore', function ($http, $bahmniCookieStore) {
        var getAllByTag = function (tags, operator) {
            return $http.get(Bahmni.Common.Constants.locationUrl, {
                params: {s: "byTags", tags: tags || "", v: "default", operator: operator || "ALL"},
                cache: true
            });
        };

        var getByUuid = function (locationUuid) {
            return $http.get(Bahmni.Common.Constants.locationUrl + "/" + locationUuid, {
                cache: true
            }).then(function (response) {
                return response.data;
            });
        };

        var getLoggedInLocation = function () {
            var cookie = $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName);
            return getByUuid(cookie.uuid);
        };

        var getVisitLocation = function (locationUuid) {
            return $http.get(Bahmni.Common.Constants.bahmniVisitLocationUrl + "/" + locationUuid, {
                headers: {"Accept": "application/json"}
            });
        };

        return {
            getAllByTag: getAllByTag,
            getLoggedInLocation: getLoggedInLocation,
            getByUuid: getByUuid,
            getVisitLocation: getVisitLocation
        };
    }]);

'use strict';

angular.module('bahmni.clinical')
    .factory('labOrderResultService', ['$http', '$q', 'configurationService', function ($http, $q, configurationService) {
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
            var paramsToBeSent = {};
            if (params.visitUuids) {
                paramsToBeSent.visitUuids = params.visitUuids;
            } else {
                if (!params.patientUuid) {
                    deferred.reject('patient uuid is mandatory');
                }
                paramsToBeSent.patientUuid = params.patientUuid;
                if (params.numberOfVisits !== 0) {
                    paramsToBeSent.numberOfVisits = params.numberOfVisits;
                }
            }

            $http.get(Bahmni.Common.Constants.bahmniLabOrderResultsUrl, {
                method: "GET",
                params: paramsToBeSent,
                withCredentials: true
            }).then(function (response) {
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

angular.module('bahmni.common.domain')
    .factory('configurationService', ['$http', '$q', function ($http, $q) {
        var configurationFunctions = {};

        configurationFunctions.encounterConfig = function () {
            return $http.get(Bahmni.Common.Constants.encounterConfigurationUrl, {
                params: {"callerContext": "REGISTRATION_CONCEPTS"},
                withCredentials: true
            });
        };

        configurationFunctions.patientConfig = function () {
            var patientConfig = $http.get(Bahmni.Common.Constants.patientConfigurationUrl, {
                withCredentials: true
            });
            return patientConfig;
        };

        configurationFunctions.patientAttributesConfig = function () {
            return $http.get(Bahmni.Common.Constants.personAttributeTypeUrl, {
                params: {v: 'custom:(uuid,name,sortWeight,description,format,concept)'},
                withCredentials: true
            });
        };

        configurationFunctions.dosageFrequencyConfig = function () {
            var dosageFrequencyConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.dosageFrequencyConceptName},
                withCredentials: true
            });
            return dosageFrequencyConfig;
        };

        configurationFunctions.dosageInstructionConfig = function () {
            var dosageInstructionConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.dosageInstructionConceptName},
                withCredentials: true
            });
            return dosageInstructionConfig;
        };

        configurationFunctions.stoppedOrderReasonConfig = function () {
            var stoppedOrderReasonConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.stoppedOrderReasonConceptName},
                withCredentials: true
            });
            return stoppedOrderReasonConfig;
        };

        configurationFunctions.consultationNoteConfig = function () {
            var consultationNoteConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name,answers)', name: Bahmni.Common.Constants.consultationNoteConceptName},
                withCredentials: true
            });
            return consultationNoteConfig;
        };

        configurationFunctions.radiologyObservationConfig = function () {
            var radiologyObservationConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: { v: 'custom:(uuid,name)', name: Bahmni.Common.Constants.radiologyResultConceptName },
                withCredentials: true
            });
            return radiologyObservationConfig;
        };

        configurationFunctions.labOrderNotesConfig = function () {
            var labOrderNotesConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name)', name: Bahmni.Common.Constants.labOrderNotesConcept},
                withCredentials: true
            });
            return labOrderNotesConfig;
        };

        configurationFunctions.defaultEncounterType = function () {
            return $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                params: {
                    property: 'bahmni.encounterType.default'
                },
                withCredentials: true,
                transformResponse: [function (data) {
                    return data;
                }]
            });
        };

        configurationFunctions.radiologyImpressionConfig = function () {
            var radiologyImpressionConfig = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {v: 'custom:(uuid,name)', name: Bahmni.Common.Constants.impressionConcept},
                withCredentials: true
            });
            return radiologyImpressionConfig;
        };

        configurationFunctions.addressLevels = function () {
            return $http.get(Bahmni.Common.Constants.openmrsUrl + "/module/addresshierarchy/ajax/getOrderedAddressHierarchyLevels.form", {
                withCredentials: true
            });
        };

        configurationFunctions.allTestsAndPanelsConcept = function () {
            var allTestsAndPanelsConcept = $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                method: "GET",
                params: {
                    v: 'custom:(uuid,name:(uuid,name),setMembers:(uuid,name:(uuid,name)))',
                    name: Bahmni.Common.Constants.allTestsAndPanelsConceptName
                },
                withCredentials: true
            });
            return allTestsAndPanelsConcept;
        };

        configurationFunctions.identifierTypesConfig = function () {
            return $http.get(Bahmni.Common.Constants.idgenConfigurationURL, {
                withCredentials: true
            });
        };

        configurationFunctions.genderMap = function () {
            return $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                method: "GET",
                params: {
                    property: 'mrs.genders'
                },
                withCredentials: true
            });
        };

        configurationFunctions.relationshipTypeMap = function () {
            return $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                method: "GET",
                params: {
                    property: 'bahmni.relationshipTypeMap'
                },
                withCredentials: true
            });
        };

        configurationFunctions.relationshipTypeConfig = function () {
            return $http.get(Bahmni.Common.Constants.relationshipTypesUrl, {
                withCredentials: true,
                params: {v: "custom:(aIsToB,bIsToA,uuid)"}
            });
        };

        configurationFunctions.loginLocationToVisitTypeMapping = function () {
            var url = Bahmni.Common.Constants.entityMappingUrl;
            return $http.get(url, {
                params: {
                    mappingType: 'loginlocation_visittype',
                    s: 'byEntityAndMappingType'
                }
            });
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
    .service('loadConfigService', ['$http', function ($http) {
        this.loadConfig = function (url) {
            return $http.get(url, {withCredentials: true});
        };
    }]);

'use strict';

angular.module('bahmni.common.domain')
    .service('encounterService', ['$http', '$q', '$rootScope', 'configurations', '$bahmniCookieStore', 'offlineService',
        function ($http, $q, $rootScope, configurations, $bahmniCookieStore, offlineService) {
            this.buildEncounter = function (encounter) {
                encounter.observations = encounter.observations || [];
                encounter.observations.forEach(function (obs) {
                    stripExtraConceptInfo(obs);
                });

                encounter.providers = encounter.providers || [];

                var providerData = $bahmniCookieStore.get(Bahmni.Common.Constants.grantProviderAccessDataCookieName);
                if (_.isEmpty(encounter.providers)) {
                    if (providerData && providerData.uuid) {
                        encounter.providers.push({"uuid": providerData.uuid});
                    } else if ($rootScope.currentProvider && $rootScope.currentProvider.uuid) {
                        encounter.providers.push({"uuid": $rootScope.currentProvider.uuid });
                    }
                }
                return encounter;
            };

            var getDefaultEncounterType = function () {
                var url = Bahmni.Common.Constants.encounterTypeUrl;
                return $http.get(url + '/' + configurations.defaultEncounterType()).then(function (response) {
                    return response.data;
                });
            };

            var getEncounterTypeBasedOnLoginLocation = function (loginLocationUuid) {
                return $http.get(Bahmni.Common.Constants.entityMappingUrl, {
                    params: {
                        entityUuid: loginLocationUuid,
                        mappingType: 'location_encountertype',
                        s: 'byEntityAndMappingType'
                    },
                    withCredentials: true
                });
            };

            var getEncounterTypeBasedOnProgramUuid = function (programUuid) {
                return $http.get(Bahmni.Common.Constants.entityMappingUrl, {
                    params: {
                        entityUuid: programUuid,
                        mappingType: 'program_encountertype',
                        s: 'byEntityAndMappingType'
                    },
                    withCredentials: true
                });
            };

            var getDefaultEncounterTypeIfMappingNotFound = function (entityMappings) {
                var encounterType = entityMappings.data.results[0] && entityMappings.data.results[0].mappings[0];
                if (!encounterType) {
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
                    return getEncounterTypeBasedOnLoginLocation(loginLocationUuid).then(function (response) {
                        return getDefaultEncounterTypeIfMappingNotFound(response);
                    });
                } else {
                    return getDefaultEncounterType();
                }
            };

            this.create = function (encounter) {
                encounter = this.buildEncounter(encounter);

                return $http.post(Bahmni.Common.Constants.bahmniEncounterUrl, encounter, {
                    withCredentials: true
                });
            };

            this.delete = function (encounterUuid, reason) {
                return $http.delete(Bahmni.Common.Constants.bahmniEncounterUrl + "/" + encounterUuid, {
                    params: {reason: reason}
                });
            };

            var stripExtraConceptInfo = function (obs) {
                obs.concept = {uuid: obs.concept.uuid, name: obs.concept.name, dataType: obs.concept.dataType };
                obs.groupMembers = obs.groupMembers || [];
                obs.groupMembers.forEach(function (groupMember) {
                    stripExtraConceptInfo(groupMember);
                });
            };

            var searchWithoutEncounterDate = function (visitUuid) {
                return $http.post(Bahmni.Common.Constants.bahmniEncounterUrl + '/find', {
                    visitUuids: [visitUuid],
                    includeAll: Bahmni.Common.Constants.includeAllObservations
                }, {
                    withCredentials: true
                });
            };

            this.search = function (visitUuid, encounterDate) {
                if (!encounterDate) {
                    return searchWithoutEncounterDate(visitUuid);
                }

                return $http.get(Bahmni.Common.Constants.emrEncounterUrl, {
                    params: {
                        visitUuid: visitUuid,
                        encounterDate: encounterDate,
                        includeAll: Bahmni.Common.Constants.includeAllObservations
                    },
                    withCredentials: true
                });
            };

            this.find = function (params) {
                return $http.post(Bahmni.Common.Constants.bahmniEncounterUrl + '/find', params, {
                    withCredentials: true
                });
            };
            this.findByEncounterUuid = function (encounterUuid) {
                return $http.get(Bahmni.Common.Constants.bahmniEncounterUrl + '/' + encounterUuid, {
                    params: {includeAll: true},
                    withCredentials: true
                });
            };

            this.getEncountersForEncounterType = function (patientUuid, encounterTypeUuid) {
                return $http.get(Bahmni.Common.Constants.encounterUrl, {
                    params: {
                        patient: patientUuid,
                        encounterType: encounterTypeUuid,
                        v: "custom:(uuid,provider,visit:(uuid,startDatetime,stopDatetime),obs:(uuid,concept:(uuid,name),groupMembers:(id,uuid,obsDatetime,value)))"
                    },
                    withCredentials: true
                });
            };

            this.getDigitized = function (patientUuid) {
                if (offlineService.isOfflineApp()) {
                    return $q.when({"data": {"results": []}});
                }
                var patientDocumentEncounterTypeUuid = configurations.encounterConfig().getPatientDocumentEncounterTypeUuid();
                return $http.get(Bahmni.Common.Constants.encounterUrl, {
                    params: {
                        patient: patientUuid,
                        encounterType: patientDocumentEncounterTypeUuid,
                        v: "custom:(uuid,obs:(uuid))"
                    },
                    withCredentials: true
                });
            };

            this.discharge = function (encounterData) {
                var encounter = this.buildEncounter(encounterData);
                return $http.post(Bahmni.Common.Constants.dischargeUrl, encounter, {
                    withCredentials: true
                });
            };
        }]);


'use strict';

angular.module('bahmni.clinical')
    .service('diseaseTemplateService', ['$http', '$q', 'clinicalAppConfigService', function ($http, $q, clinicalAppConfigService) {
        this.getLatestDiseaseTemplates = function (patientUuid, diseaseTemplates, startDate, endDate) {
            var url = Bahmni.Common.Constants.diseaseTemplateUrl;
            var params = {"patientUuid": patientUuid, "diseaseTemplateConfigList": diseaseTemplates};
            params.startDate = startDate && moment(startDate).format(Bahmni.Common.Constants.ServerDateTimeFormat);
            params.endDate = endDate && moment(endDate).format(Bahmni.Common.Constants.ServerDateTimeFormat);
            var deferred = $q.defer();
            $http.post(url, params, {
                withCredentials: true,
                headers: {"Accept": "application/json", "Content-Type": "application/json"}
            }).then(function (response) {
                var diseaseTemplates = mapDiseaseTemplates(response.data, clinicalAppConfigService.getAllConceptsConfig());
                deferred.resolve(diseaseTemplates);
            });
            return deferred.promise;
        };

        this.getAllDiseaseTemplateObs = function (patientUuid, diseaseName, startDate, endDate) {
            var url = Bahmni.Common.Constants.AllDiseaseTemplateUrl;
            var params = {patientUuid: patientUuid, diseaseTemplateConfigList: [{"templateName": diseaseName}]};
            params.startDate = startDate && moment(startDate).format(Bahmni.Common.Constants.ServerDateTimeFormat);
            params.endDate = endDate && moment(endDate).format(Bahmni.Common.Constants.ServerDateTimeFormat);
            var deferred = $q.defer();
            $http.post(url,
                params, {
                    withCredentials: true,
                    headers: {"Accept": "application/json", "Content-Type": "application/json"}
                }).then(function (diseaseTemplateResponse) {
                    var diseaseTemplates = mapDiseaseTemplates([diseaseTemplateResponse.data], clinicalAppConfigService.getAllConceptsConfig());
                    deferred.resolve(diseaseTemplates[0]);
                });
            return deferred.promise;
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

angular.module('bahmni.common.domain')
    .service('observationsService', ['$http', function ($http) {
        this.fetch = function (patientUuid, conceptNames, scope, numberOfVisits, visitUuid, obsIgnoreList, filterObsWithOrders, patientProgramUuid) {
            var params = {concept: conceptNames};
            if (obsIgnoreList) {
                params.obsIgnoreList = obsIgnoreList;
            }
            if (filterObsWithOrders != null) {
                params.filterObsWithOrders = filterObsWithOrders;
            }

            if (visitUuid) {
                params.visitUuid = visitUuid;
                params.scope = scope;
            } else {
                params.patientUuid = patientUuid;
                params.numberOfVisits = numberOfVisits;
                params.scope = scope;
                params.patientProgramUuid = patientProgramUuid;
            }
            return $http.get(Bahmni.Common.Constants.observationsUrl, {
                params: params,
                withCredentials: true
            });
        };

        this.getByUuid = function (observationUuid) {
            return $http.get(Bahmni.Common.Constants.observationsUrl, {
                params: {observationUuid: observationUuid},
                withCredentials: true
            });
        };

        this.fetchForEncounter = function (encounterUuid, conceptNames) {
            return $http.get(Bahmni.Common.Constants.observationsUrl, {
                params: {encounterUuid: encounterUuid, concept: conceptNames},
                withCredentials: true
            });
        };

        this.fetchForPatientProgram = function (patientProgramUuid, conceptNames, scope) {
            return $http.get(Bahmni.Common.Constants.observationsUrl, {
                params: {patientProgramUuid: patientProgramUuid, concept: conceptNames, scope: scope},
                withCredentials: true
            });
        };

        this.getObsRelationship = function (targetObsUuid) {
            return $http.get(Bahmni.Common.Constants.obsRelationshipUrl, {
                params: {
                    targetObsUuid: targetObsUuid
                },
                withCredentials: true
            });
        };

        this.getObsInFlowSheet = function (patientUuid, conceptSet, groupByConcept, orderByConcept, conceptNames,
                                           numberOfVisits, initialCount, latestCount, groovyExtension,
                                           startDate, endDate, patientProgramUuid) {
            var params = {
                patientUuid: patientUuid,
                conceptSet: conceptSet,
                groupByConcept: groupByConcept,
                orderByConcept: orderByConcept,
                conceptNames: conceptNames,
                numberOfVisits: numberOfVisits,
                initialCount: initialCount,
                latestCount: latestCount,
                name: groovyExtension,
                startDate: Bahmni.Common.Util.DateUtil.parseLongDateToServerFormat(startDate),
                endDate: Bahmni.Common.Util.DateUtil.parseLongDateToServerFormat(endDate),
                enrollment: patientProgramUuid
            };
            return $http.get(Bahmni.Common.Constants.observationsUrl + "/flowSheet", {
                params: params,
                withCredentials: true
            });
        };
    }]);

'use strict';

angular.module('bahmni.common.conceptSet')
    .factory('conceptSetService', ['$http', '$q', '$bahmniTranslate', function ($http, $q, $bahmniTranslate) {
        var getConcept = function (params, cache) {
            params['locale'] = params['locale'] || $bahmniTranslate.use();
            return $http.get(Bahmni.Common.Constants.conceptSearchByFullNameUrl, {
                params: params,
                cache: cache
            });
        };

        var getComputedValue = function (encounterData) {
            var url = Bahmni.Common.Constants.encounterModifierUrl;
            return $http.post(url, encounterData, {
                withCredentials: true,
                headers: {"Accept": "application/json", "Content-Type": "application/json"}
            });
        };

        var getObsTemplatesForProgram = function (programUuid) {
            var url = Bahmni.Common.Constants.entityMappingUrl;
            return $http.get(url, {
                params: {
                    entityUuid: programUuid,
                    mappingType: 'program_obstemplate',
                    s: 'byEntityAndMappingType'
                }
            });
        };

        return {
            getConcept: getConcept,
            getComputedValue: getComputedValue,
            getObsTemplatesForProgram: getObsTemplatesForProgram
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
    .service('loggingService', function () {
        var log = function (errorDetails) {
            $.ajax({
                type: "POST",
                url: "/log",
                contentType: "application/json",
                data: angular.toJson(errorDetails)
            });
        };

        return {
            log: log
        };
    });

'use strict';

angular.module('bahmni.clinical')
    .factory('treatmentService', ['$http', '$q', 'appService', function ($http, $q, appService) {
        var createDrugOrder = function (drugOrder) {
            return Bahmni.Clinical.DrugOrder.create(drugOrder);
        };
        var getActiveDrugOrdersFromServer = function (patientUuid, startDate, endDate) {
            return $http.get(Bahmni.Common.Constants.bahmniDrugOrderUrl + "/active", {
                params: {
                    patientUuid: patientUuid,
                    startDate: startDate,
                    endDate: endDate
                },
                withCredentials: true
            });
        };

        var getPrescribedAndActiveDrugOrders = function (patientUuid, numberOfVisits, getOtherActive, visitUuids, startDate, endDate, getEffectiveOrdersOnly) {
            return $http.get(Bahmni.Common.Constants.bahmniDrugOrderUrl + "/prescribedAndActive", {
                params: {
                    patientUuid: patientUuid,
                    numberOfVisits: numberOfVisits,
                    getOtherActive: getOtherActive,
                    visitUuids: visitUuids,
                    startDate: startDate,
                    endDate: endDate,
                    getEffectiveOrdersOnly: getEffectiveOrdersOnly
                },
                withCredentials: true
            }).success(function (response) {
                for (var key in response) {
                    response[key] = response[key].map(createDrugOrder);
                }
            });
        };

        var getConfig = function () {
            return $http.get(Bahmni.Common.Constants.drugOrderConfigurationUrl, {
                withCredentials: true
            });
        };

        var getProgramConfig = function () {
            var programConfig = appService.getAppDescriptor() ? appService.getAppDescriptor().getConfigValue("program") || {} : {};
            return programConfig;
        };

        var getActiveDrugOrders = function (patientUuid, fromDate, toDate) {
            var programConfig = getProgramConfig();
            var startDate = programConfig.showDetailsWithinDateRange ? fromDate : null;
            var endDate = programConfig.showDetailsWithinDateRange ? toDate : null;

            var deferred = $q.defer();
            getActiveDrugOrdersFromServer(patientUuid, startDate, endDate).success(function (response) {
                var activeDrugOrders = response.map(createDrugOrder);
                deferred.resolve(activeDrugOrders);
            });
            return deferred.promise;
        };

        var getPrescribedDrugOrders = function (patientUuid, includeActiveVisit, numberOfVisits, fromDate, toDate) {
            var programConfig = getProgramConfig();
            var startDate = programConfig.showDetailsWithinDateRange ? fromDate : null;
            var endDate = programConfig.showDetailsWithinDateRange ? toDate : null;

            var deferred = $q.defer();
            $http.get(Bahmni.Common.Constants.bahmniDrugOrderUrl, {
                method: "GET",
                params: {
                    patientUuid: patientUuid,
                    numberOfVisits: numberOfVisits,
                    includeActiveVisit: includeActiveVisit,
                    startDate: startDate,
                    endDate: endDate
                },
                withCredentials: true
            }).success(function (response) {
                var activeDrugOrders = response.map(createDrugOrder);
                deferred.resolve(activeDrugOrders);
            });
            return deferred.promise;
        };

        var getNonCodedDrugConcept = function () {
            var deferred = $q.defer();
            $http.get(Bahmni.Common.Constants.globalPropertyUrl, {
                method: "GET",
                params: {
                    property: 'drugOrder.drugOther'
                },
                withCredentials: true,
                headers: {
                    Accept: 'text/plain'
                }
            }).success(function (conceptUuid) {
                deferred.resolve(conceptUuid);
            });
            return deferred.promise;
        };

        var getAllDrugOrdersFor = function (patientUuid, conceptSetToBeIncluded, conceptSetToBeExcluded, isActive, patientProgramUuid) {
            var deferred = $q.defer();
            var params = {patientUuid: patientUuid};
            if (conceptSetToBeIncluded) {
                params.includeConceptSet = conceptSetToBeIncluded;
            }
            if (conceptSetToBeExcluded) {
                params.excludeConceptSet = conceptSetToBeExcluded;
            }
            if (isActive !== undefined) {
                params.isActive = isActive;
            }
            if (patientProgramUuid) {
                params.patientProgramUuid = patientProgramUuid;
            }

            $http.get(Bahmni.Common.Constants.bahmniDrugOrderUrl + "/drugOrderDetails", {
                params: params,
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            });
            return deferred.promise;
        };

        var voidDrugOrder = function (drugOrder) {
            var deferred = $q.defer();

            $http.delete([Bahmni.Common.Constants.ordersUrl, '/', drugOrder.uuid].join('')).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
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
