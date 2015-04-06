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
	var mapBoundaries;
	var infowindow;
	var config;
	var locIndex;

	// Handle marker click
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
	};
	
	
	// Send the geocode request corresponding to locIndex
	function sendGeocodeRequest() {
		var request = "https://maps.googleapis.com/maps/api/geocode/json?address=";
		request += config.destinations[locIndex].name;
		
		// Send a request to find the coordinates
		var locRequest = new XMLHttpRequest();
		locRequest.onreadystatechange = function() {
			if (locRequest.readyState==4 && locRequest.status==200)	{
				parseGeocodeResponse(locRequest, locIndex);
			}
		};
		locRequest.open("GET", request, true);
		locRequest.send();
	};
	
	// Parse the geocode request response and add the marker corresponding to locIndex
	// to the map
	function parseGeocodeResponse(locRequest) {
		var response = JSON.parse(locRequest.responseText);
		if (response.status !== 'OK') {
			throw "The place \"" + config.destinations[locIndex].name + "\" could not be located";
		}
		var localisation = new google.maps.LatLng(
			response.results[0].geometry.location.lat,
			response.results[0].geometry.location.lng);

		// Add a marker on the map
		var markerOptions = {
			map: map,
			position: localisation,
			draggable: false,
			clickable: true/*,
			anchorPoint: new google.maps.Point(0, 0)*/
		}
		var marker = new google.maps.Marker(markerOptions);

		// Handle clicks on the marker
		google.maps.event.addListener(marker, "click", (function(marker, locIndex){
				return function(){
					handleMarkerClick(marker, locIndex);
				}
			})(marker, locIndex));

		// Update the boundaries
		if (mapBoundaries == null) {
			mapBoundaries = new google.maps.LatLngBounds(
				localisation,
				localisation);
		}
		else {
			mapBoundaries.extend(localisation);
		}

		locIndex++;
		if (locIndex === config.destinations.length)
		{
			// Set the boundaries of the map
			map.fitBounds(mapBoundaries);
		}
		else
		{
			// Send the next request
			sendGeocodeRequest();
		}
	};

	// Create the map
	var mapOptions = {
		zoom: 8,
		center: new google.maps.LatLng(0, 0)
	};
	map = new google.maps.Map(canvas, mapOptions);

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

	// Send the first geolocalisation request (the other ones
	// will follow)
	locIndex = 0;
	sendGeocodeRequest();
};
