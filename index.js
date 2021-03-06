// all global variables ====================

var map;
var geocoder;
var bounds;
var infoWindow;
var open_marker;
var click_1st = null;
var click_2nd = null;
var last_time_start_address = null;
var last_time_end_address = null;
var success_first_distance = false;
var directionsService;
var directionsRenderer;
const custom_markers_array = [];
const labels = "AB";

var action_btn = document.querySelector('.action-button');
var travel_model = document.getElementById('travel_model_val').value;
var first_location = document.getElementById("first_location");
var second_location = document.getElementById("second_location");
var response_map_display = document.getElementById("response_map");
var open_latLng = {
    lat: 41.85,
    lng: -87.65
};



// init google map ============================

function initMap() {
    // map init

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: open_latLng
    });

    open_marker = new google.maps.Marker({
        position: open_latLng,
        map,
        draggable: true,
        label: labels[0],
    });

    open_marker.setMap(null);

    bounds = new google.maps.LatLngBounds();
    geocoder = new google.maps.Geocoder();
    infoWindow = new google.maps.InfoWindow();
    infoWindow.open(map);

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        map
    });
    directionsRenderer.setMap(map);

    directionsRenderer.addListener("directions_changed", function () {
        const directions = directionsRenderer.getDirections();
        var res_info = directions.routes[0].legs[0];
        first_location.value = res_info.start_address;
        second_location.value = res_info.end_address;
        click_1st = res_info.start_address;
        click_2nd = res_info.end_address;
        last_time_start_address = res_info.start_address;
        last_time_end_address = res_info.end_address;

        response_map_display.innerHTML =    `${res_info.start_address} <b> To </b> ${res_info.end_address} <br/>
                                            <b>Distance :</b> ${res_info.distance.text}les <br/> 
                                            <b>Travel Time :</b> ${res_info.duration.text}`;
    });

    search_box();

    document.getElementById('travel_model_val').addEventListener("change", travel_model_selector);

    map.addListener("click", (e) => {
        custom_markers_array.length < 2 && custom_mark(e.latLng);
        !click_2nd && geocode_recording(e.latLng);
    });

    function travel_model_selector() {
        travel_model = this.value;
        click_1st && click_2nd && the_routes(directionsService, directionsRenderer, click_1st, click_2nd);
    };


    google.maps.event.addListener(open_marker, 'dragend', function (e) {
        geocode_recording(e.latLng, true);
    });

    // end init map
};




// functions =============================
action_btn.addEventListener("click", function () {
    click_1st && click_2nd && the_routes(directionsService, directionsRenderer, click_1st, click_2nd);
});


function custom_mark(latLng) {
    if (custom_markers_array.length > 0) {
        const single_markers = new google.maps.Marker({
            position: latLng,
            map: map,
            zoom: 14,
            draggable: true,
            label: labels[1],
        });

        custom_markers_array.push(single_markers);
    } else {
        open_latLng = {
            lat: latLng.lat(),
            lng: latLng.lng()
        };

        open_marker.setMap(map);
        open_marker.setPosition(open_latLng);
        custom_markers_array.push(open_marker);
    }
};


function search_box() {
    const searchBox_1 = new google.maps.places.SearchBox(first_location);
    const searchBox_2 = new google.maps.places.SearchBox(second_location);

    searchBox_1.addListener("places_changed", () => {
        const places = searchBox_1.getPlaces();
        !success_first_distance && map_bounce_to(places);
        click_1st = places[0].formatted_address;
        click_1st && click_2nd && the_routes(directionsService, directionsRenderer, click_1st, click_2nd);
    });

    searchBox_2.addListener("places_changed", () => {
        const places = searchBox_2.getPlaces();
        !success_first_distance && map_bounce_to(places);
        click_2nd = places[0].formatted_address;
        click_1st && click_2nd && the_routes(directionsService, directionsRenderer, click_1st, click_2nd);
    });
};


function map_bounce_to(place) {
    custom_mark(place[0].geometry.location);
    if (place[0].geometry.viewport) {
        bounds.union(place[0].geometry.viewport);
    } else {
        bounds.extend(place[0].geometry.location);
    };
    map.fitBounds(bounds);
};


function geocode_recording(latLng, drag = false) {
    geocoder
        .geocode({
            location: latLng
        })
        .then((response) => {
            var get_address = response.results[0].formatted_address;
            !drag && geocode_formatted_address(get_address);
            drag && (click_1st = first_location.value = get_address);
        })
        .catch((e) => {
            console.log(e)
        });
};


function geocode_formatted_address(the_address) {
    if (!click_1st) {
        click_1st = first_location.value = the_address;
    } else {
        click_2nd = second_location.value = the_address;
        the_routes(directionsService, directionsRenderer, click_1st, click_2nd);
    };
}



function the_routes(directionsService, directionsRenderer, first, second) {
    directionsService
        .route({
            origin: {
                query: first,
            },
            destination: {
                query: second,
            },
            travelMode: google.maps.TravelMode[travel_model],
        })
        .then((response) => {
            directionsRenderer.setMap(map);

            custom_markers_array[0].setMap(null);
            custom_markers_array[1].setMap(null);
            directionsRenderer.setDirections(response);
            success_first_distance = true;

            var res_info = response.routes[0].legs[0];
            last_time_start_address = res_info.start_address;
            last_time_end_address = res_info.end_address;

            response_map_display.innerHTML = `${res_info.start_address} <b> To </b> ${res_info.end_address} <br/>
                                                 <b>Distance :</b> ${res_info.distance.text}les <br/> 
                                                 <b>Travel Time :</b> ${res_info.duration.text}`;

        })
        .catch(() => {
            if (!success_first_distance) {
                custom_markers_array.length && custom_markers_array[0].setMap(null);
                custom_markers_array.length && custom_markers_array[1].setMap(null);

                while (custom_markers_array.length) {
                    custom_markers_array.pop();
                };

                click_1st = click_2nd = second_location.value = first_location.value = null;
            } else {
                if (click_1st !== last_time_start_address) {
                    click_1st = last_time_start_address;
                    first_location.value = last_time_start_address;
                };
                if (click_2nd !== last_time_end_address) {
                    click_2nd = last_time_end_address;
                    second_location.value = last_time_end_address;
                };
            };

            response_map_display.innerHTML = 'Sorry, we could not calculate the directions';
        });
};




//  form validations

first_location.addEventListener('input', function () {
    !this.value && empty_input_validation();
});

second_location.addEventListener('input', function () {
    !this.value && empty_input_validation();
});


function empty_input_validation() {
    directionsRenderer.setMap(null);
    the_routes(directionsService, directionsRenderer, null, null);
    click_1st = click_2nd = last_time_start_address = last_time_end_address = second_location.value = first_location.value = null;
    success_first_distance = false;

    while (custom_markers_array.length) {
        custom_markers_array.pop();
    };
};