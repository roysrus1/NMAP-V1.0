# NMAP-V1.0
Roy NMAP


#Project Description: Javascript application that combines Google Maps with other cloud apps


This app allows a user to browse for events (sports, music) via a map based GUI.

## What are the functions of this app:
1. This app provides a GUI that lets a user find events via 3 methods:
    a) Select a venue from the list box, type in the type of event and click search.
    b) Type in a City in the Zoom section, type in an event, then click search.
    c) Simply pan the map to a desired location, type in the event type, then click search.  For this option,
        no venue should be selected.  If required, this can be acheived via the 'Reset Venue' button.
2.  A user can find additional services of interest ('pizza', 'motel') in the map on display by typing in the service desired
    in the "Search for Nearby Places" section.
3.  The app allows users to select 'favorite events' by right-clicking on any of the markers returned from the search.
4.  The app lets users store and retrieve favorites across sessions.

## App Components:
1. The app uses Google Maps for map displays.
2. Event information is from a cloud API provided by eventful.com.
3. Venues were retrieved from a Firebase repository.
4. Enhanced marker js library used from OMS (OverlappingMarkerSpiderfier):
    https://github.com/jawj/OverlappingMarkerSpiderfier


##Directions to install and run:
1. Fork the repository at https://github.com/roysrus1/NMAP-V1.0/.
2. Open index.html in your browser (tested on chrome).


##Rubric:

The Rubric can be found at:  <a href="https://review.udacity.com/#!/rubrics/17/view"></a>

##Notes - what worked in this revision
Full functional mashup of Google Maps, Eventful, Firebase and OMS to provide a easy user experience in finding events.


##Notes - what did not work
All functions worked satisfactorily.
