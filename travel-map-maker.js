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

function createTravelMap(canvas, config) {
	// Global variables
	var map;
	var mapBoundaries;
	var infowindow;
	var locIndex;
	
	// Global variables used to compute the path
	var pathDirection;
	var pathPosition;

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
			+ "' style='display: block; margin-left: auto; margin-right: auto; height: 180px;'></img>";
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
			clickable: true,
			icon: {
	      path: google.maps.SymbolPath.CIRCLE,
	      fillColor: config.markerColor,
	      fillOpacity: 1,
	      scale: 6,
	      strokeColor: 'DimGray',
	      strokeWeight: 3
	    },
			animation: google.maps.Animation.DROP
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
		
		// Update the path
		if (pathPosition == null) {
			pathDirection = new google.maps.LatLng(0, 0);
			pathPosition = localisation;
		}
		else {
			drawPathTo(localisation);
		}

		locIndex++;
		if (locIndex !== config.destinations.length)
		{
			// Send the next request
			setTimeout(sendGeocodeRequest, 100);
		}
	};
	
	// Compute the distance (sort of) between two locations on the map
	function computeDistance(location1, location2) {
		return Math.sqrt(Math.pow(location1.lat() - location2.lat(), 2)
			+ Math.pow(location1.lng() - location2.lng(), 2));
	}
	
	// Compute the norm (sort of) of a vector as a LatLng object
	function computeNorm(vector) {
		return Math.sqrt(Math.pow(vector.lat(), 2)
				+ Math.pow(vector.lng(), 2));
	}
	
	// Draw a curved line between pathPosition and destination on the map.
	function drawPathTo(destination) {
		var path = new google.maps.MVCArray();
		var initialDistance = computeDistance(pathPosition, destination);
		var currentDistance = initialDistance;
		// The smaller this coeff is, the smoother and more precise the curve is,
		// but there may be performance issues, and the curve may orbite a little around destinations
		// with low values. If bigger than 1 nothing happens.
		var coeff = 0.05;
		var maxSpeed = coeff * initialDistance;
		
		path.push(pathPosition);

		// Compute each point of the path while we are to far away from our destination
		while (currentDistance > maxSpeed) {
			// Normalize the direction to a percentage of the total distance, we don't
			// want to go too fast otherwise we're going to orbite around our destination
			var norm = computeNorm(pathDirection);
			if (norm > maxSpeed) {
				pathDirection = new google.maps.LatLng(
					maxSpeed * pathDirection.lat() / norm,
					maxSpeed * pathDirection.lng() / norm);
			}
			
			// Change a little bit the direction of the path
			var delta = new google.maps.LatLng(
				2.5 * coeff * maxSpeed * (destination.lat() - pathPosition.lat()) / currentDistance,
				2.5 * coeff * maxSpeed * (destination.lng() - pathPosition.lng()) / currentDistance);
			pathDirection = new google.maps.LatLng(
				(1 - 2.5 * coeff) * pathDirection.lat() + delta.lat(),
				(1 - 2.5 * coeff) * pathDirection.lng() + delta.lng());
			
			// Update the current position
			pathPosition = new google.maps.LatLng(pathPosition.lat() + pathDirection.lat(),
				pathPosition.lng() + pathDirection.lng());
			currentDistance = computeDistance(pathPosition, destination);
			
			path.push(pathPosition);
		}
		
		// Draw the polyline
		var options = {
			clickable: false,
			path: path,
			map: map,
			strokeColor: config.pathColor
		};
		var polyline = new google.maps.Polyline(options);
	}
	
	// Main
	
	// Set the default options
	if (! config.mapZoom) {
		config.mapZoom = 2;
	}
	if (! config.mapCenter) {
		config.mapCenter = new google.maps.LatLng(40, 0);
	}
	if (! config.pathColor) {
		config.pathColor = "Tomato";
	}
	if (! config.markerColor) {
		config.markerColor = "Tomato";
	}

	// Create the map
	var mapOptions = {
		zoom: config.mapZoom,
		center: config.mapCenter
	};
	map = new google.maps.Map(canvas, mapOptions);

	// Send the first geolocalisation request (the other ones
	// will follow)
	locIndex = 0;
	setTimeout(sendGeocodeRequest, 400);
};
