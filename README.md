# Travel map maker
Small javascript plugin used to generate a map describing a travel.
The plugin generates a google map and adds markers for each steps of the trip. On click on a
marker a small description associated with a picture is shown. The plugin also draws
a smooth path linking the markers.

## Usage
### Google maps API
In order to use this plugin, you will need a [Google Map API key]
(https://developers.google.com/maps/documentation/javascript/tutorial#api_key).
Once you have it, simply add in your code (replacing API_KEY by the key provided by Google):

```html
<script type="text/javascript"
      src="https://maps.googleapis.com/maps/api/js?key=API_KEY">
```

### Syntax
There is only one method provided by this plugin:

```javascript
  createTravelMap(canvas, steps, options)
```

 - ```canvas```: reference to the div in which the map should be drawn,
 - ```steps```: list of steps of the trip,
 - ```options```: object defining the options of the map.

### Step specifications

A step as the following attributes:
 - ```place```: name of the geographic location,
 - ```description```: short description of what happened there,
 - ```image```: url of the related image (optional).
 
### Options specifications
 
The option class has the following attributes:
 - ```mapZoom```: zoom of the map (integer),
 - ```mapCenter```: center of the map (as a google.maps.LatLng object),
 - ```markerColor```: color of the markers,
 - ```pathColor```: color of the path linking the markers.
 
### Example

This code will show a small trip between Lyon and Berlin:

```html
<!DOCTYPE html>
<html>
	<header>
		<style type="text/css">
			#map-canvas { width: 1000px; height: 800px;}
		</style>
		<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js"></script>
		<script type="text/javascript" src="travel-map-maker.js"></script>
		<script type="text/javascript">
			function initialize() {
			  var steps = [
						{
							name: "Lyon",
							description: "<p>I took the train from here.</p>"
						},
						{
							name: "Frankfurt",
							description: "<p>I went through.</p>"
						},
						{
							name: "Berlin",
							description: "<p>I arrived here.</p>"
						}
					];
				var options = {
					mapZoom: 4,
					mapCenter: new google.maps.LatLng(50, 20)
				};
    		createTravelMap(document.getElementById("map-canvas"), steps, options);
			}
			google.maps.event.addDomListener(window, "load", initialize);
		</script>
	</header>
	<body>
		<div id="map-canvas"></div>
	</body>
</html>
```

## Licence
[Apache](http://www.apache.org/licenses/)

