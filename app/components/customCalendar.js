// Author: Padam Dahal, Technical Advisor, GIZ/S2HSP (Nepal)
// This nepali calendar customization is based on the BAHMNI 0.90 version
// Modification might require for other versions of BAHMNI

// Nepali datepicker everywhere ------
try{
	var app = angular.module('bahmni.common.uiHelper');
	app.directive('input', function () {
		var link = function ($scope, element, attrs, ngModel) {
			if(element[0].type == 'date'){
				var html = element.parent();
				var customDateField = $('<input type="text" class="customDatePicker" placeholder="Nepali Date" />');
				customDateField.appendTo(html);
				
				// if value is set translate to nepali and fill the date
				var model = element.attr('ng-model');
				var adDate;
				if(model == 'patient.birthdate'){
					if($scope.patient.birthdate != null || $scope.patient.birthdate != ""){
						adDate = new Date($scope.patient.birthdate);
						
						// Modify for other calendars based on the calendar implementation /////////////////////////////////////////////////////////
						var customDate = calendarFunctions.getBsDateByAdDate(adDate.getFullYear(), adDate.getMonth()+1, adDate.getDate());
						customDate = calendarFunctions.bsDateFormat("%y-%m-%d", customDate.bsYear, customDate.bsMonth, customDate.bsDate);
						////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						
						customDateField.val(customDate);
					}
				}else if(model == 'newRelationship.endDate'){
					adDate = $scope.newRelationship.endDate;
				}else if(model == 'patient.deathDate'){
					adDate = $scope.patient.deathDate;
				}else if(model == 'programEnrollmentDate' || model == 'targetModel[attribute.name]'){
					// for programs
				}else if(model == 'date'){
					// for retrospective data entry
				}else{
					// For Observation of date type
					if($scope.hasOwnProperty('observation')){
						if($scope.observation.value != null && $scope.observation.value != "" && $scope.observation.value !== undefined){
							adDate = new Date($scope.observation.value);
							
							// Modify for other calendars based on the calendar implementation ///////////////////////////////////////////////////////// 
							var customDate = calendarFunctions.getBsDateByAdDate(adDate.getFullYear(),adDate.getMonth()+1, adDate.getDate());
							customDate = calendarFunctions.bsDateFormat("%y-%m-%d", customDate.bsYear, customDate.bsMonth, customDate.bsDate)
							////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
							
							customDateField.val(customDate);
						}
					}
				}
				
				// Assign custom datepicker in the new input field
				// Modify for other calendars based on calendar implementation ///////////
				customDateField.nepaliDatePicker({
					dateFormat: "%y-%m-%d",
					closeOnDateSelect: true
				});
				/////////////////////////////////////////////////////////////////////////
				
				// Update the date in ad Date on nepali date select
				// Modify for other calendars based on calendar implementation //////////////////
				customDateField.on("dateSelect", function (event) {
					var adDate = calendarFunctions.formattedAd(event.datePickerData.adDate);
					customDateField.prev('input').val(adDate);
					customDateField.prev('input').trigger("change");
					customDateField.prev('input').trigger("blur");
				});
				//////////////////////////////////////////////////////////////////////////////////
			}
		};
		return { link: link };
	});
}catch(e){
	console.log('App not initialized... [bahmni.common.uiHelper]');
}

// Clinical dashboard (display)
try {
	var clinicalApp = angular.module('bahmni.clinical');

	// List of visits are wrapped in a tag with class name 'visit'
	clinicalApp.directive('a', function () {
		var link = function ($scope, element, attrs, ngModel) {
			// Patient dashboard, visit list
			if(element.context.className === 'visit'){
				// for visit start date
				var startDate = new Date($scope.visit.startDatetime);
				
				// Modify for other calendars based on the calendar implementation /////////////////////////////////////////
				var startDateCustom = calendarFunctions.getBsDateByAdDate(startDate.getFullYear(),startDate.getMonth()+1,startDate.getDate());
				startDateCustom = calendarFunctions.bsDateFormat('%y|%m|%d', startDateCustom.bsYear, startDateCustom.bsMonth, startDateCustom.bsDate);
				//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				
				$scope.visit.startDatetime = startDateCustom
				
				// for visit end date
				if($scope.visit.hasOwnProperty('stopDatetime') && $scope.visit.stopDatetime != null){
					var endDate = new Date($scope.visit.stopDatetime);
					
					// Modify for other calendars based on the calendar implementation /////////////////////////////////////////////////
					var endDateCustom = calendarFunctions.getBsDateByAdDate(endDate.getFullYear(), endDate.getMonth()+1, endDate.getDate());
					endDateCustom = calendarFunctions.bsDateFormat('%y|%m|%d', endDateCustom.bsYear, endDateCustom.bsMonth, endDateCustom.bsDate)
					/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					
					$scope.visit.stopDatetime = endDateCustom;
				}
			}	
		};
		return { link: link };
	});

	// // Values wrapped in span tag (Encounter Date, visit paginator-visit-date)
	clinicalApp.directive('span', function () {
		var link = function ($scope, element, attrs, ngModel) {
			
			// For patient dashboard - encounter datetime
			if(element.context.className === 'obs-date'){
				var encDate = new Date(Date($scope.obsGroup.date));
				
				// Modify for other calendars based on calendar implementation //////////////////////////////////////////////////////////////////////////////////////////////////////
				var customDate = calendarFunctions.getBsDateByAdDate(encDate.getFullYear(),encDate.getMonth()+1,encDate.getDate());
				customDate = calendarFunctions.bsDateFormat('%y|%m|%d', customDate.bsYear, customDate.bsMonth, customDate.bsDate)+" "+encDate.getHours()+":"+encDate.getMinutes();
				/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				
				$scope.obsGroup.date = customDate;
			}
			
			
			// For patient dashboard - Diagnosis datetime
			if(element.attr('id') === 'diagnosisDate'){
				var diagDate = new Date($scope.diagnosis.diagnosisDateTime);
				
				// Modify for other calendars based on calendar implementation //////////////////////////////////////////////////////////////////////////////////////////////////////
				var customDate = calendarFunctions.getBsDateByAdDate(diagDate.getFullYear(),diagDate.getMonth()+1,diagDate.getDate());
				customDate = calendarFunctions.bsDateFormat('%y|%m|%d', customDate.bsYear, customDate.bsMonth, customDate.bsDate)+" "+diagDate.getHours()+":"+diagDate.getMinutes();
				/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				
				$scope.diagnosis.diagnosisDateTime = customDate;
				if($scope.diagnosis.hasOwnProperty('latestDiagnosis') && $scope.diagnosis.latestDiagnosis != null){
					$scope.diagnosis.latestDiagnosis.diagnosisDateTime = customDate;
				}
			}
			
			// Visit summary page
			if(element.context.className === 'visit-date'){
				var startDateCustom_formatted;
				var stopDateCustom_formatted;
				
				// for visit start date				
				var startDate = new Date($scope.visitSummary.startDateTime);
				
				// Modify for other calendars based on calendar implementation //////////////////////////////////////////////////////////////////////////////////
				var startDateCustom = calendarFunctions.getBsDateByAdDate(startDate.getFullYear(), startDate.getMonth()+1, startDate.getDate());
				startDateCustom_formatted = calendarFunctions.bsDateFormat('%y|%m|%d', startDateCustom.bsYear, startDateCustom.bsMonth, startDateCustom.bsDate);
				/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

				// for visit stop date
				if($scope.visitSummary.hasOwnProperty('stopDateTime') && $scope.visitSummary.stopDateTime != null){
					var endDate = new Date($scope.visitSummary.stopDateTime);
					
					// Modify for other calendars based on calendar implementation /////////////////////////////////////////////////////////////////////////////////////
					var stopDateCustom = calendarFunctions.getBsDateByAdDate(endDate.getFullYear(), endDate.getMonth()+1, endDate.getDate());
					stopDateCustom_formatted = '- '+calendarFunctions.bsDateFormat('%y|%m|%d', stopDateCustom.bsYear, stopDateCustom.bsMonth, stopDateCustom.bsDate);
					/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

				}

				element.context.children[0].innerHTML = startDateCustom_formatted;
				element.context.children[1].innerHTML = stopDateCustom_formatted;
				
			}
		};
		return { link: link };
	});

	// Observation values of date type in the patient dashboard are wrapped in pre tag
	clinicalApp.directive('pre', function () {
		var link = function ($scope, element, attrs, ngModel) {
			// for observation values of date type
			if(typeof $scope !== 'undefined' && typeof $scope.observation !== 'undefined'){
				if($scope.observation.hasOwnProperty('groupMembers') && $scope.observation.groupMembers != null){
					if($scope.observation.concept.dataType == 'Date'){
						var obsValueDate = new Date($scope.observation.value);
						
						// Modify for other calendars based on calendar implementation ////////////////////////////////////////////////////////////
						var obsValueDateCustom = calendarFunctions.getBsDateByAdDate(obsValueDate.getFullYear(), obsValueDate.getMonth()+1, obsValueDate.getDate());
						//obsValueDateCustom = obsValueDateCustom.bsYear+'|'+obsValueDateCustom.bsMonth+'|'+obsValueDateCustom.bsDate;
						obsValueDateCustom = calendarFunctions.bsDateFormat('%y|%m|%d',obsValueDateCustom.bsYear, obsValueDateCustom.bsMonth, obsValueDateCustom.bsDate);
						///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
						
						$scope.observation.value = obsValueDateCustom;
					}
				}
			}	
		};
		return { link: link };
	});
	
	// Computed values in the form are wrapped in div tag
	clinicalApp.directive('div', function () {
		var link = function ($scope, element, attrs, ngModel) {
			// For computed Value
			if(element.context.className === 'compuptedValue'){
				// Todo : check for the valid datetime value
				
				
				var obsValueDateComputed = new Date($scope.observation.value);
				
				// Modify for other calendars based on calendar implementation /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				var obsValueDateComputedCustom = calendarFunctions.getBsDateByAdDate(obsValueDateComputed.getFullYear(), obsValueDateComputed.getMonth()+1, obsValueDateComputed.getDate());
				obsValueDateComputedCustom = calendarFunctions.bsDateFormat('%y|%m|%d',obsValueDateComputedCustom.bsYear, obsValueDateComputedCustom.bsMonth, obsValueDateComputedCustom.bsDate);
				////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				
				$scope.observation.value = obsValueDateComputedCustom;
			}			
		};
		return { link: link };
	});
	
} catch(e) {
    console.log('App not initialized... [bahmni.clinical]');
}
