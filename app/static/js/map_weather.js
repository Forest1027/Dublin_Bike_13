var map;
var infobox;

function loadMapScenario() {
    map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        center: new Microsoft.Maps.Location(53.3498, -6.2603),
        zoom: 14
    });

    infobox = new Microsoft.Maps.Infobox(map.getCenter(), {
        visible: false,
        maxWidth: 350,
        maxHeight: 200,
        description: '<div style="height:20px; overflow: auto;"><div>'
    });

    infobox.setMap(map);



    getStations();
}



/*var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        var myObj = JSON.parse(this.responseText);
        a(myObj)

    }
};
xmlhttp.open("GET", "/static/js/stations.json", true);
xmlhttp.send();*/



function pushpinClicked(e) {
    //Make sure the infobox has metadata to display.
    if (e.target.metadata) {
        //get station number
        var number = e.target.metadata.title.split(' ')[2];
        //Set the infobox options with the metadata of the pushpin.
        infobox.setOptions({
            location: e.target.metadata.location0,
            title: e.target.metadata.title,
            description: e.target.metadata.description,
            visible: true,
            actions: [{
                    label: 'Dublin Weather',
                    eventHandler: function () {
                        var ifrm = document.getElementById('forecast_embed');
                        ifrm.src = '//forecast.io/embed/#lat=' + e.target.metadata.lat0 + '&lon=' + e.target.metadata.lng0 + '&name=Dublin';
                    }

                                },
                {
                    label: 'Biking Chart',
                    eventHandler: function () {
                        alert("---")
                        /*$.ajax({
                            url: "/station_occupancy_timeline/" + number,
                            type: "GET",
                            dataType: "json",
                            success: function (data) {
                                //transform json
                                var json = transformJson(data);
                                createChart(json);
                            }
                        });*/

                    }
                                }
                            ]
        });
    }
}

function transformJson(data) {
    var availability = data['availability'];
    for (var key in availability) {
        alert(key+"---"+availability[key]);
    }
    
}

function initStations(obj) {
    for (var i = 0; i < obj.length; i++) {
        var number = obj[i].number;
        var name = obj[i].name;
        //console.log(obj[i].name)
        var lat = obj[i].lat;
        var lng = obj[i].lng;
        //var bike_stands = obj[i].bike_stands;
        //var available_bike_stands = obj[i].available_bike_stands;
        //var available_bikes = obj[i].available_bikes;
        var address = obj[i].address;
        var loc = new Microsoft.Maps.Location(lat, lng);
        var userPin = new Microsoft.Maps.Pushpin(map.getCenter(), {
            visible: false,
            color: Microsoft.Maps.Color.fromHex('#000D29'),
            roundClickableArea: true
        });
        userPin.setLocation(loc);
        userPin.setOptions({
            visible: true
        });
        userPin.metadata = {
            title: 'Bike Station: ' + number,
            description: 'Station Name: ' + name + '<br/>Address: ' + address,
            location0: loc,
            lat0: lat,
            lng0: lng
        };
        /*if (available_bike_stands != 0) {
                var userPin = new Microsoft.Maps.Pushpin(map.getCenter(), {
                visible: false,
                color: Microsoft.Maps.Color.fromHex('#000D29'),
                roundClickableArea: true
            });
            userPin.setLocation(loc);
            userPin.setOptions({
                visible: true
            });
            userPin.metadata = {
                title: 'Bike Station: ' + number,
                description: 'Station Name: ' + name + '<br/>Bike Stands: ' + bike_stands + '<br/>Available Bike Stands: ' + available_bike_stands + '<br/>Available Bikes: ' + available_bikes + '<br/>Address: ' + address,
                location0: loc,
                lat0: lat,
                lng0: lng
            };



            //map.entities.push(userPin);
        } else {
            var userPin = new Microsoft.Maps.Pushpin(map.getCenter(), {
                //icon: 'https://www.bingmapsportal.com/Content/images/poi_custom.png',
                visible: false,
                //text: number.toString(),
                color: Microsoft.Maps.Color.fromHex('#F14D49'),
                roundClickableArea: true
            });
            userPin.setLocation(loc);
            userPin.setOptions({
                visible: true
            });
            userPin.metadata = {
                title: 'Bike Station: ' + number,
                description: 'Station Name: ' + name + '<br/>Bike Stands: ' + bike_stands + '<br/>Available Bike Stands: ' + available_bike_stands + '<br/>Available Bikes: ' + available_bikes + '<br/>Address: ' + address,
                location0: loc,
                lat0: lat,
                lng0: lng
            };
        };*/

        Microsoft.Maps.Events.addHandler(userPin, 'click', pushpinClicked);
        map.entities.push(userPin);

    }
}

function getStations() {
    $.ajax({
        url: "/stations",
        type: "GET",
        dataType: "json",
        success: function (data) {
            initStations(data["stations"])
        }
    });

}
