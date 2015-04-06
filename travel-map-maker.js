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

if (!(typeof window.google === "object" && window.google.maps)) {
	throw "Google Maps API is required. Please register the following "
		+ "JavaScript library https://maps.googleapis.com/maps/api/js";
}

function createTravelMap(canvas, configFile) {
	// Global variables
	var map;
	var infowindow;
	var config;

	// Private method to handle marker click
	function handleMarkerClick(marker, i) {
		// Close the last infowindow
		if (infowindow) {
			infowindow.close();
		}
		// Build the description of the infowindow
		var description = "<h3>" + config.destinations[i].name + "</h3>";
		if (config.destinations[i].image) {
			description += "<img src='" + config.destinations[i].image
			+ "' style='display: block; margin-left: auto; margin-right: auto'></img>";
		}
		description	+= config.destinations[i].description;

		// Create a new infowindow
		infowindow = new google.maps.InfoWindow({
			content: description,
			maxWidth: 300
		});
		infowindow.open(map, marker);
	}

	// Parse the config file
	var configRequest = new XMLHttpRequest();
	configRequest.open("GET", configFile, false);
	configRequest.send(null);
	try {
		config = JSON.parse(configRequest.responseText);
	}
	catch (err)
	{
		err.message = "Error while parsing \"" + configFile + "\": "
			+ err.message;
		throw err;
	}

	// Create the map
	var mapOptions = {
		zoom: 8,
		center: new google.maps.LatLng(0, 0)
	};
	map = new google.maps.Map(canvas, mapOptions);

	// Loop over the destinations to get the localisation of each place
	var boundaries = null;
	for (i = 0; i < config.destinations.length; i++) { 
		// Create the request
		var request = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		request += config.destinations[i].name;
		
		// Send a request to find the coordinates
		var locRequest = new XMLHttpRequest();
		locRequest.open("GET", request, false);
		locRequest.send(null);
		var response = JSON.parse(locRequest.responseText);
		if (response.status !== 'OK') {
			throw "The place \"" + config.destinations[i].name + "\" could not be located";
		}
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

		// Handle clicks on the marker
		google.maps.event.addListener(marker, "click", (function(marker, i){
				return function(){
					handleMarkerClick(marker, i);
				}
			})(marker, i));

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

	// Set the boundaries of the map
	map.fitBounds(boundaries);
};
