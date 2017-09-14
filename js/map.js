      // Initial map related code

      var map;
      var oms;

      var markers = [];
      var events = new Set();
      var favs = new Set();
      var defaultIcon;
      var highlightedIcon;
      var favoriteIcon;
      var highlightedFavicon;
      var largeInfowindow;
      var numFav = 0;
      var searchCircle;
      var zoomAddress ="";

      var vm;

      var cities =[];
      var filterCities = [];


      class Event {
        constructor(id, title, description, position, url, fav, label, favLabel, type) {
          this.id = id;
          this.title = title;
          this.desc = description;
          this.position = position;
          this.url = url;
          this.fav = fav;
          this.label = label;
          this.favLabel = favLabel;
          this.type = type;                //can be 'event' or 'place'
          if (fav) {
            this.icon = favoriteIcon;
          } else {
            this.icon = defaultIcon;
          }
          events.add(this);
        }
      }


      class Poploc {
        constructor(name, city, lat, lng) {
          this.name = name;
          this.city = city;
          this.lat = lat;
          this.lng = lng;
        }
      }

      class City {
        constructor(name, locs) {
          this.name = name;
          this.locs = locs;
        }
      }

      function initMap() {
        // Create a styles array to use with the map.
        var styles = [
          {
            featureType: 'water',
            stylers: [
              { color: '#19a0d8' }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.stroke',
            stylers: [
              { color: '#ffffff' },
              { weight: 6 }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [
              { color: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
              { color: '#efe9e4' },
              { lightness: -40 }
            ]
          },{
            featureType: 'transit.station',
            stylers: [
              { weight: 9 },
              { hue: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
              { visibility: 'off' }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [
              { lightness: 100 }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [
              { lightness: -100 }
            ]
          },{
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [
              { visibility: 'on' },
              { color: '#f0e4d3' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
              { color: '#efe9e4' },
              { lightness: -25 }
            ]
          }
        ];

        // Constructor creates a new map - only center and zoom are required.
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 40.7829, lng: -73.9654},
          zoom: 12,
          styles: styles,
          mapTypeControl: false
        });

        oms = new OverlappingMarkerSpiderfier(map, {
          markersWontMove: true,
          markersWontHide: true,
          basicFormatEvents: true
        });

        var searchBox = new google.maps.places.SearchBox(
            document.getElementById('places-search'), {
              bounds: map.getBounds()
            });
        // Bias the searchbox to within the bounds of the map.
        searchBox.setBounds(map.getBounds());


        // Listen for the event fired when the user selects a prediction from the
        // picklist and retrieve more details for that place.
        searchBox.addListener('places_changed', function() {
          searchBoxPlaces(this);
        });

        // Listen for the event fired when the user selects a prediction and clicks
        // "go" more details for that place.
        document.getElementById('go-places').addEventListener('click', textSearchPlaces);


        largeInfowindow = new google.maps.InfoWindow();
        defaultIcon = makeMarkerIcon('0091ff');
        highlightedIcon = makeMarkerIcon('FFFF24');
        favoriteIcon = makeMarkerIcon('33ff3b');
        highlightedFavicon = makeMarkerIcon('6c3483');

        document.getElementById('search-event').addEventListener('click', searchEvent);

        document.getElementById('venue-reset').addEventListener('click', resetVenue);

        document.getElementById('show-favorites').addEventListener('click', function() {
          showFavorites();
        });



        var config = {
          apiKey: "AIzaSyCxchpGqfVg7Kg1ckQoJc2NEEFF4-nJjg8",
          authDomain: "udacity-events-001.firebaseapp.com",
          databaseURL: "https://udacity-events-001.firebaseio.com",
          projectId: "udacity-events-001",
          storageBucket: "udacity-events-001.appspot.com",
          messagingSenderId: "735171455150"
        };
        firebase.initializeApp(config);
        var db1 = firebase.database();

        db1.ref('locs/').once('value').then(function(snapshot) {
            var dbResult = snapshot.val().Obj;
            for (var item of dbResult) {
                cities.push(item);
            }
        });


        setTimeout(function() {

            if (cities.length===0) {
             $('#resp').html('<h4> Venues not found, please reload page </h4><br>');
            }

            var defaultLoc = new Poploc ('New York City', 'New York City', 40.7829, -73.9654);
            var locs = [];
            locs.push(defaultLoc);
            var defaultCity = new City ('#Default', locs);
            cities.unshift(defaultCity);

            function viewModel () {
              var self = this;
              filterCities = sortCity(cities).slice();
              self.fgroups = ko.observableArray(filterCities);
            }

            vm = new viewModel();
            ko.applyBindings(vm);

        },500);


        document.getElementById('save-faves').addEventListener('click', saveFaves);
        document.getElementById('get-faves').addEventListener('click', getFaves);
        document.getElementById('del-faves').addEventListener('click', delFaves);

        document.getElementById('zoom-to-area').addEventListener('click', function() {
          zoomToArea();
        });
      }

      function sortCity(records) {
          var result = records.sort(function(l, r){
            return (l.name.toLowerCase() > r.name.toLowerCase() ? 1 : -1);
          });

        return result;

      }


      function filterCity(filter, records) {
          if (filter === "") {
            return records;
          }
          var fRecords = [];
          for (var rIndex = 0; rIndex < records.length; rIndex++) {
              var record = records[rIndex];
              var name = record.name.substring(0,filter.length).toLowerCase();
              if (name == filter.toLowerCase()) {
                fRecords.push(record);
              }
          }
          return sortCity(fRecords);
      }


      function clearVenue() {
        var elements = document.getElementById("pop-locs").options;
        for(var i = 0; i < elements.length; i++){
          elements[i].selected = false;
        }
      }

      function resetVenue() {
          clearVenue();

          var currLen1 = vm.fgroups().length;
          for (var i=0; i<currLen1; i++) {
            vm.fgroups.pop();
          }

          filterCities = sortCity(cities).slice();
          var currLen2 = filterCities.length;
          for (var j=0; j<currLen2; j++) {
            vm.fgroups.push(filterCities[j]);
          }

          document.getElementById('zoom-to-area-text').value = "";

      }

      function createMarker(title, id, position, label) {
        var marker = new google.maps.Marker({
          position: position,
          title: title,
          animation: google.maps.Animation.DROP,
          icon: defaultIcon,
          id: id,
          label: label
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        addMarkerlisteners (marker);
        return marker;
      }

      function addMarkerlisteners (marker) {

        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('spider_click', function() {
          populateInfoWindow(this, largeInfowindow);
        });

        marker.addListener('rightclick', function() {
          var thisEvent = getEvent(this);
          if (thisEvent.fav) {
            this.setIcon(defaultIcon);
            ToggleFavorite(this);
          } else {
            if (numFav==10) {return;}
            this.setIcon(highlightedFavicon);
            ToggleFavorite(this);
          }
        });
        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
          var thisEvent = getEvent(this);
          if (thisEvent.fav) {
            this.setIcon(highlightedFavicon);
          } else {
            this.setIcon(highlightedIcon);
          }
        });

        marker.addListener('mouseout', function() {
          var thisEvent = getEvent(this);
          if (thisEvent.fav) {
              this.setIcon(favoriteIcon);
          } else {
            this.setIcon(defaultIcon);
          }
        });

      }

      //This function will loop through the markers and remove all non-favorite markers.
      function clearMarkers(type) {
        for (var item of events) {
          if ((!item.fav) && (item.type == type)) {
            var thisMarker = getMarker(item);
            oms.removeMarker(thisMarker);

            var index = markers.indexOf(thisMarker);
            if (index > -1) {
              markers.splice(index, 1);
            }

            events.delete(item);
          }
        }
      }


      function showMarkers(type) {

        if (events.size===0) {return;}
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var item of events) {
          if (item.type == type) {
            var thisMarker = getMarker(item);
            oms.addMarker(thisMarker);
            bounds.extend(thisMarker.position);
          }
        }
        map.fitBounds(bounds);
      }


      //This function will show events marked as favorites
      function showFavorites() {
        clearMarkers('event');
        if (numFav) {
          showMarkers('event');
        }
      }

      function clearFavorites() {
        for (var item of events) {
          if (item.fav) {
            var thisMarker = getMarker(item);
            oms.removeMarker(thisMarker);
            events.delete(item);
          }
        }
        numFav=0;
      }

      function ToggleFavorite(marker) {
        var thisEvent = getEvent(marker);

        if (thisEvent.fav) {
          thisEvent.fav = !thisEvent.fav;
          thisEvent.favLabel = null;
          marker.label = thisEvent.label;
          numFav--;
        } else {
          if (numFav == 9) {return;}
          thisEvent.fav = !thisEvent.fav;
          thisEvent.favLabel = getFavlabel();
          marker.label = thisEvent.favLabel;
          numFav++;
        }
      }

      function getFavlabel() {
        for (var i = 1; i < 10; i++) {
          var favFlag = true;
          for (var item of events) {
            if (item.favLabel==i) {
              favFlag = false;
              break;
            }
          }
          if (favFlag) {
            return i;
          }
        }
        return null;
      }

      function getEvent(marker) {
        for (var item of events) {
          if ((item.id == marker.id)) {
            return item;
          }
        }
      }

      function getMarker(event) {
        for (var i=0; i<markers.length; i++) {
          if (markers[i].id == event.id) {
            return markers[i];
          }
        }
      }

      function uniqueEvent(id){
        for (var item of events) {
          if ((item.id == id)) {
            return false;
          }
        }
        return true;
      }

      function processEvent(response) {

        var lat1, long1, title1, desc1, eventId1, url1;
        var validEvents = 0;
        var numEvents = response.total_items;
        //var numItems = response.page_size;

        clearMarkers('event');

        for (var i = 0; i < numEvents; i++) {
          var errFlag = false;
          try {
            lat1 = response.events.event[i].latitude;
            long1 = response.events.event[i].longitude;
            title1 = response.events.event[i].title;
            desc1 = response.events.event[i].description;
            eventId1 = response.events.event[i].id;
            url1 = response.events.event[i].url;
          }
          catch(err) {errFlag = true;}

          if ((desc1 === null) || (desc1 === undefined)) {
            errFlag = true;
          }

          if (!uniqueEvent(eventId1)) {errFlag = true;}

          // Create a marker per location, and put into markers array.
          if (!errFlag) {

            var pos1 = new google.maps.LatLng(lat1, long1);
            var label1 = (validEvents).toString();
            var marker = createMarker(title1, eventId1, pos1, label1);

            var thisEvent = new Event (eventId1, title1, desc1, pos1, url1, false, label1, null, 'event');

            validEvents++;

          }
        }

        if (validEvents>0) {
          $('#resp').html('<h4>Events Found: ' + validEvents + '</h4><br>');
          showMarkers('event');
        } else {
          $('#resp').html('<h4>No events found ' + '<br>');
        }

      }

      function searchEvent() {

        $('#resp').html('<h4> Loading Event Information </h4><br>');

        var eventType = document.getElementById('search-event-type').value;
        if (eventType === '') {
          eventType = 'jazz';
        }
        var eventDate = document.getElementById('search-event-date').value;
        if (eventDate === '') {
          eventDate = 'Future';
        }

        var venue = document.getElementById('pop-locs').value;
        var searchRadius = 16500;
        var searchCenter;
        var eventLoc1;
        var popLatLng;

        if (venue=== "") {
          searchCenter = map.getCenter();
          eventLoc1 = '&location='+ searchCenter.toUrlValue() + '&within=10&units=mi&page_size=20';
          $('#resp').html('<h4> Searching for events </h4><br>' );
        } else {
          for (var i=0; i< cities.length; i++) {
            var popLoc = cities[i].locs;
            for (var j=0; j< popLoc.length; j++) {
              if (popLoc[j].name == venue) {
                popLatLng =  popLoc[j].lat + ',' + popLoc[j].lng ;
                break;
              }
            }
          }

          if (venue=="New York City") {
            eventLoc1 = '&location='+ popLatLng + '&within=10&units=mi&page_size=20';
          } else {
            eventLoc1 = '&location='+ popLatLng + '&within=0.5&units=mi&page_size=20';
            searchRadius = 700;
          }

          var splitLoc = popLatLng.split(",");
          searchCenter = new google.maps.LatLng(splitLoc[0], splitLoc[1]);
          $('#resp').html('<h4> Searching near ' + venue + '</h4><br>');
          document.getElementById('zoom-to-area-text').value = "";
        }

        if (typeof searchCircle !== "undefined") {
          searchCircle.setMap(null);
        }

        searchCircle = new google.maps.Circle({
          strokeColor: '#EDED97',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#C1AABE',
          fillOpacity: 0.35,
          map: map,
          center: searchCenter,
          radius: searchRadius
        });



        var eventKey = '&app_key=7jB7VTdjGHbLzBvk';
        var eURL = 'http://api.eventful.com/json/events/search?...&keywords=';
        var eventsURL = eURL+eventType+eventLoc1+'&date='+eventDate+eventKey;

        var eventRequestTimeout = setTimeout(function(){
              $('#resp').html('<h4> Failed to get event response</h4>');
          }, 8000);

        $.ajax({
            url: eventsURL,
            dataType: 'jsonp',
            jsonp: "callback",
            success: function(response) {

              clearTimeout(eventRequestTimeout);
              var numEvents = response.total_items;
              $('#resp').html('<h4>number of events = ' + numEvents + '</h4><br>');
              processEvent(response);
            }
        });
      }

      // Save/Retrieve related code


      function delFaves() {
        //delete favorites
        localStorage.notes = JSON.stringify([]);
      }

      function saveFaves () {
        //localStorage.notes = JSON.stringify([]);
        for (var item of events) {
          if (item.fav) {
            var data = JSON.parse(localStorage.notes);
            data.push(item);
            localStorage.notes = JSON.stringify(data);
          }
        }
      }

      function getFaves () {
        favs = JSON.parse(localStorage.notes);
        clearFavorites();
        numFav=0;
        for (var item of favs) {
          if ((uniqueEvent(item.id)) && (numFav<9)){
            item.favLabel = numFav+1;
            var marker = createMarker (item.title, item.id, item.position, item.favLabel.toString());
            marker.setIcon(favoriteIcon);
            events.add(item);
            numFav++;
          }
        }

        showFavorites();
      }


// Map related code



      // one infowindow which will open at the marker that is clicked, and populate based
      // on that markers position.
      function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
          // Clear the infowindow content to give the streetview time to load.
          infowindow.setContent('');
          infowindow.marker = marker;
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
          });


          var thisEvent = getEvent(marker);
          var description = thisEvent.desc;
          var title = thisEvent.title;
          // var label = thisEvent.label;
          // var favLabel = thisEvent.favLabel;
          // var fav = thisEvent.fav;
          var url = thisEvent.url;

          var innerHTML = '<div>';
          innerHTML += '<h3>' + title + '</h3><br>';
          innerHTML += '<strong>' + description + '</strong>';
          if (url) {
              var quoteStr = '"';
              var targetStr = ' target=' + quoteStr + '_blank' + quoteStr;
              innerHTML += '<br><br> URL: <a href=' + quoteStr + url + quoteStr + targetStr + '> Event Site </a>';
          }
          innerHTML += '</div><hr>';

          infowindow.setContent(innerHTML);


          // Open the infowindow on the correct marker.
          infowindow.open(map, marker);
        }
      }

      // // This function takes in a COLOR, and then creates a new marker
      // // icon of that color. The icon will be 21 px wide by 34 high, have an origin
      // // of 0, 0 and be anchored at 10, 34).
      function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
          '|40|_|%E2%80%A2',
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34),
          new google.maps.Size(21,34));
        return markerImage;
      }

      // // This function takes the input value in the find nearby area text input
      // // locates it, and then zooms into that area. This is so that the user can
      // // show all listings, then decide to focus on one area of the map.
      function zoomToArea() {
        // Initialize the geocoder.
        var geocoder = new google.maps.Geocoder();
        // Get the address or place that the user entered.
        zoomAddress = document.getElementById('zoom-to-area-text').value;
        // Make sure the address isn't blank.
        if (zoomAddress === '') {
          window.alert('You must enter an area, or address.');
        } else {


          clearVenue();


          var currLen1 = vm.fgroups().length;
          for (var i=0; i<currLen1; i++) {
            vm.fgroups.pop();
          }

          filterCities = filterCity(zoomAddress, cities).slice();
          var currLen2 = filterCities.length;
          for (var j=0; j<currLen2; j++) {
            vm.fgroups.push(filterCities[j]);
          }


          // Geocode the address/area entered to get the center. Then, center the map
          // on it and zoom in
          geocoder.geocode(
            { address: zoomAddress,
              componentRestrictions: {country: 'US'}
            }, function(results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
              } else {
                window.alert('We could not find that location - try entering a more' +
                    ' specific place.');
              }
            });  //geocoder closes here
          }  // else closes here
      }
      // This function fires when the user selects a searchbox picklist item.
      // It will do a nearby search using the selected query string or place.
      function searchBoxPlaces(searchBox) {
        clearMarkers('place');
        searchBox.setBounds(map.getBounds());
        //window.alert('1 ' + map.getBounds());
        var places = searchBox.getPlaces();
        if (places.length === 0) {
          window.alert('We did not find any places matching that search!');
        } else {
        // For each place, get the icon, name and location.
          //window.alert('3 ' + places.length);
          createMarkersForPlaces(places);
        }
      }

      // This function firest when the user select "go" on the places search.
      // It will do a nearby search using the entered query string or place.
      function textSearchPlaces() {
        var bounds = map.getBounds();
        clearMarkers('place');
        var placesService = new google.maps.places.PlacesService(map);
        placesService.textSearch({
          query: document.getElementById('places-search').value,
          bounds: bounds
        }, function(results, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            createMarkersForPlaces(results);
          }
        });
      }

      // This function creates markers for each place found in either places search.
      function createMarkersForPlaces(places) {

        for (var i = 0; i < places.length; i++) {
          var place = places[i];
          var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
          };
          // Create a marker for each place.
          var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
          });
          // Create a single infowindow to be used with the place details information
          // so that only one is open at once.
          var placeInfoWindow = new google.maps.InfoWindow();
          // If a marker is clicked, do a place details search on it in the next function.
          marker.addListener('click', function() {
            if (placeInfoWindow.marker == this) {
              console.log("This infowindow already is on this marker!");
            } else {
              getPlacesDetails(this, placeInfoWindow);
            }
          });
          markers.push(marker);

          var id1 = place.place_id;
          var lat1 = place.geometry.location.lat();
          var long1 = place.geometry.location.lng();

          var pos1 = new google.maps.LatLng(lat1, long1);

          var thisPlace = new Event (id1, place.name, 'none', pos1, place.url, false, null, null, 'place');

          // if (place.geometry.viewport) {
          //   // Only geocodes have viewport.
          //   bounds.union(place.geometry.viewport);
          // } else {
          //   bounds.extend(place.geometry.location);
          // }
        }
        // map.fitBounds(bounds);
      }

      // This is the PLACE DETAILS search - it's the most detailed so it's only
      // executed when a marker is selected, indicating the user wants more
      // details about that place.
      function getPlacesDetails(marker, infowindow) {
        var service = new google.maps.places.PlacesService(map);
        service.getDetails({
          placeId: marker.id
        }, function(place, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again.
            infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
              innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address) {
              innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
              innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.place_id) {
              innerHTML += '<br> ID: ' + place.place_id;
            }
            if (place.opening_hours) {
              innerHTML += '<br><br><strong>Hours:</strong><br>' +
                  place.opening_hours.weekday_text[0] + '<br>' +
                  place.opening_hours.weekday_text[1] + '<br>' +
                  place.opening_hours.weekday_text[2] + '<br>' +
                  place.opening_hours.weekday_text[3] + '<br>' +
                  place.opening_hours.weekday_text[4] + '<br>' +
                  place.opening_hours.weekday_text[5] + '<br>' +
                  place.opening_hours.weekday_text[6];
            }
            if (place.photos) {
              innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                  {maxHeight: 100, maxWidth: 200}) + '">';
            }
            if (place.url) {
              innerHTML += '<br> URL: ' + place.place.url;
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
              infowindow.marker = null;
            });
          }
        });
      }