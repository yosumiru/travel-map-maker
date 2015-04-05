/*
	TravelMapMaker
	Small javascript plugin used to generate a map describing a travel.

	Copyright 2015 F. Rioland

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
 */

if (!(typeof window.google === 'object' && window.google.maps)) {
	throw 'Google Maps API is required. Please register the following JavaScript library https://maps.googleapis.com/maps/api/js'
}

function createTravelMap(canvas, destinations) {
	// Create the map
	var mapOptions = {
		zoom: 8,
		center: new google.maps.LatLng(0, 0)
	};
	var map = new google.maps.Map(canvas, mapOptions);
  
	// Loop over the destinations to get the localisation of each place
	var boundaries = null;
	for (i = 0; i < destinations.length; i++) { 
		// Create the request
		var request = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		request += destinations[i];
		
		// Send a request to find the coordinates
		var xmlHttp = new XMLHttpRequest();
	    xmlHttp.open( "GET", request, false );
	    xmlHttp.send( null );
	    var response = JSON.parse(xmlHttp.responseText);
	    if (response.status === 'OK') {
	    	var localisation = new google.maps.LatLng(
	    		response.results[0].geometry.location.lat,
	    		response.results[0].geometry.location.lng);
	    	
	    	// Add a marker on the map
	    	var markerOptions = {
	    		map: map,
	    		position: localisation,
	    		draggable: false,
	    		clickable: true
	    	}
	    	var marker = new google.maps.Marker(markerOptions);
	    	// Todo: Handle marker click
	    	
	    	// Update the boundaries
	    	if (boundaries == null) {
	    		boundaries = new google.maps.LatLngBounds(
	    			localisation,
	    			localisation);
	    	}
	    	else {
		    	boundaries.extend(localisation);
	    	}
	    }
	    else {
	    	// Todo: Handle error feedback
	    }
	}
	
	// Set the boundaries of the map
	map.fitBounds(boundaries);
};
