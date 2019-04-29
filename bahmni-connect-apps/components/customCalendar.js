$(document).ready(function(){
	/*$("body").on("focus", "input[type=date]", function(){
		
		var customDateField = $('<input type="text" class="customDatePicker" placeholder="Nepali Date" readonly/>');
		$(this).css('pointer-events','none');
		$(this).css('disabled','true');
		customDateField.appendTo($(this).parent());	
		
		customDateField.calendarsPicker({
			calendar: $.calendars.instance('nepali'),
			yearRange: '-120:+30',
			duration: "fast",
			showAnim: "",
			dateFormat: 'yyyy-mm-dd',
			onSelect: function(npDate) {
				// Conversion and assignment
				var converter = new DateConverter();
				converter.setNepaliDate(npDate[0]._year, npDate[0]._month, npDate[0]._day);
				customDateField.prev('input').val(converter.toEnglishString()).trigger('change').trigger('blur');
				customDateField.prev('input').attr('value', converter.toEnglishString()).trigger('change').trigger('blur');
				customDateField.prev('input').value = converter.toEnglishString();
				//customDateField.prev('input').trigger('onchange',function(){console.log('date seelected')});
				//customDateField.prev('input').trigger('changeDate');
				//customDateField.prev('input').datepicker.onSelect();
				//triggerDateSelect(converter.toEnglishString());
				//customDateField.prev('input').dispatchEvent('change');
				customDateField.prev('input').trigger( "dp.change" );
			}
		});
	});*/
	
	/*$("body").on("click", "input[type=date]", function(){
		var customDateField = $('<input type="text" class="customDatePicker" placeholder="Nepali Date" readonly/>');
		//$(this).css('pointer-events','none');
		//$(this).css('disabled','true');
		customDateField.appendTo($(this).parent());	
		
		customDateField.calendarsPicker({
			calendar: $.calendars.instance('nepali'),
			yearRange: '-120:+30',
			duration: "fast",
			showAnim: "",
			dateFormat: 'yyyy-mm-dd',
			onSelect: function(npDate) {
				// Conversion and assignment
				var converter = new DateConverter();
				converter.setNepaliDate(npDate[0]._year, npDate[0]._month, npDate[0]._day);
				$(this).prev('input').val(converter.toEnglishString());
				$(this).prev('input').value = converter.toEnglishString();
			}
		});
	});*/	
});


// Nepali datepicker everywhere

try{
	var app = angular.module('bahmni.common.uiHelper');
	app.directive('input', function () {
		var link = function ($scope, element, attrs, ngModel) {
			if(element[0].type == 'date'){
				var html = element.parent();
				var customDateField = $('<input type="text" class="customDatePicker" placeholder="Nepali Date" readonly/>');
				customDateField.appendTo(html);
				
				// if value is set translate to nepali and fill the date
				// Get the model that holds the data value
				var model = element.attr('ng-model');
				
				try{
					if(eval('$scope.'+model) != null || eval('$scope.'+model) != 'undefined' && eval('$scope.'+model).getfullYear() != 1970){		
						var adDate = new Date(eval('$scope.'+model));

						var converter = new DateConverter();
						converter.setEnglishDate(adDate.getFullYear(), adDate.getMonth()+1, adDate.getDate());						
						customDateField.val(converter.toNepaliString());
					}
				}catch(e){
					console.log('Error converting to the custom date.');
				}
				
				customDateField.calendarsPicker({
					calendar: $.calendars.instance('nepali'),
					yearRange: '-120:+30',
					duration: "fast",
					showAnim: "",
					dateFormat: 'yyyy-mm-dd',
					onSelect: function(npDate) {
						// Conversion and assignment
						var converter = new DateConverter();
						converter.setNepaliDate(npDate[0]._year, npDate[0]._month, npDate[0]._day)
						customDateField.prev('input').val(converter.toEnglishString());
						customDateField.prev('input').trigger("change");
						customDateField.prev('input').trigger("blur");
					}
				});
			}
		};
		return { link: link };
	});	
}catch(e){
	console.log('App not initialized... [...]');
}

// Clinical dashboard (display)
try {
	var clinicalApp = angular.module('bahmni.clinical');
	
	clinicalApp.directive('input', function () {
		var link = function ($scope, element, attrs, ngModel) {
			if(element[0].type == 'date'){
				var html = element.parent();
				var customDateField = $('<input type="text" class="customDatePicker" placeholder="Nepali Date" readonly/>');
				customDateField.appendTo(html);
				
				// if value is set translate to nepali and fill the date
				// Get the model that holds the data value
				var model = element.attr('ng-model');
				
				try{
					if(eval('$scope.'+model) != null || eval('$scope.'+model) != 'undefined' && eval('$scope.'+model).getfullYear() != 1970){		
						var adDate = new Date(eval('$scope.'+model));

						var converter = new DateConverter();
						converter.setEnglishDate(adDate.getFullYear(), adDate.getMonth()+1, adDate.getDate());						
						customDateField.val(converter.toNepaliString());
					}
				}catch(e){
					console.log('Error converting to the custom date.');
				}
				
				customDateField.calendarsPicker({
					calendar: $.calendars.instance('nepali'),
					yearRange: '-120:+30',
					duration: "fast",
					showAnim: "",
					dateFormat: 'yyyy-mm-dd',
					onSelect: function(npDate) {
						// Conversion and assignment
						var converter = new DateConverter();
						converter.setNepaliDate(npDate[0]._year, npDate[0]._month, npDate[0]._day)
						customDateField.prev('input').val(converter.toEnglishString());
						customDateField.prev('input').trigger("change");
						customDateField.prev('input').trigger("blur");
					}
				});
			}
		};
		return { link: link };
	});
	// List of visits are wrapped in a tag with class name 'visit'
	clinicalApp.directive('a', function () {
		var link = function ($scope, element, attrs, ngModel) {
			// Patient dashboard, visit list
			
			if(element.context.className === 'visit'){
				
				var model = element.attr('ng-model');
				// for visit start date
				var startDate = new Date($scope.visit.startDatetime);
				
				// Date conversion
				var converter = new DateConverter();
				converter.setEnglishDate(startDate.getFullYear(), startDate.getMonth()+1, startDate.getDate());		
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				$scope.visit.startDatetime = customDate;
				
				// for visit end date
				if($scope.visit.hasOwnProperty('stopDatetime') && $scope.visit.stopDatetime != null){
					var endDate = new Date($scope.visit.stopDatetime);
					// Date conversion
					var converter = new DateConverter();
					converter.setEnglishDate(endDate.getFullYear(), endDate.getMonth()+1, endDate.getDate());
					var customDate = converter.toNepaliStringLong();
					// End date conversion
					
					$scope.visit.stopDatetime = customDate;
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
				
				// Date conversion
				var converter = new DateConverter();
				converter.setEnglishDate(encDate.getFullYear(), encDate.getMonth()+1, encDate.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				$scope.obsGroup.date = customDate;
			}
			
			
			// For patient dashboard - Diagnosis datetime
			if(element.attr('id') === 'diagnosisDate'){
				var diagDate = new Date($scope.diagnosis.diagnosisDateTime);
				
				// Date Conversion
				var converter = new DateConverter();
				converter.setEnglishDate(diagDate.getFullYear(), diagDate.getMonth()+1, diagDate.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
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
				
				// Date Conversion
				var converter = new DateConverter();
				converter.setEnglishDate(startDate.getFullYear(), startDate.getMonth()+1, startDate.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				$scope.visitSummary.startDateTime = customDate;
				//element.context.children[0].innerHTML = startDateCustom_formatted;
				
				// for visit stop date
				if($scope.visitSummary.hasOwnProperty('stopDateTime') && $scope.visitSummary.stopDateTime != null){
					var endDate = new Date($scope.visitSummary.stopDateTime);
					
					// Date Conversion
					var converter = new DateConverter();
					converter.setEnglishDate(endDate.getFullYear(), endDate.getMonth()+1, endDate.getDate());						
					var customDate = converter.toNepaliStringLong();
					// End date conversion
					$scope.visitSummary.stopDateTime = customDate
					
					//element.context.children[1].innerHTML = stopDateCustom_formatted;

				}				
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
						
						// Date Conversion
						var converter = new DateConverter();
						converter.setEnglishDate(obsValueDate.getFullYear(), obsValueDate.getMonth()+1, obsValueDate.getDate());						
						var customDate = converter.toNepaliStringLong();
						// End date conversion
						
						$scope.observation.value = customDate;
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
			/*
			if(element.context.className === 'compuptedValue'){
				// Todo : check for the valid datetime value
				
				var obsValueDateComputed = new Date($scope.observation.value);
				
				// Date Conversion
				var converter = new DateConverter();
				converter.setEnglishDate(obsValueDateComputed.getFullYear(), obsValueDateComputed.getMonth()+1, obsValueDateComputed.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				$scope.observation.value = customDate;
			}*/	
			
		};
		return { link: link };
	});
	
	// Minimize form sections
	/*clinicalApp.directive('button', function () {
		
		var link = function ($scope, element, attrs, ngModel) {
			
			if(element.attr('title') == "{{ ::'CONCEPT_SET_GROUP_COLLAPSE_ALL_KEY' | translate}}"){
				console.log('Trigger "Collapse All" Event');
				$scope.conceptSet.minimizeInnerSections(event);
				
			}			
		};
		return { link: link };
	});*/
	
} catch(e) {
    console.log('App not initialized... [bahmni.clinical]');
}


