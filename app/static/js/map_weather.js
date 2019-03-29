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
        maxWidth: 600,
        maxHeight: 400,
        description: '<div style="height:10px; overflow: auto;"><div>'
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
        //var number = e.target.metadata.title.split(' ')[2];
        //Set the infobox options with the metadata of the pushpin.
        infobox.setOptions({
            location: e.target.metadata.location0,
            title: e.target.metadata.title,
            description: e.target.metadata.description,
            visible: true,
        });
    }
}

function jumpChart(number, lat, lng) {
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
        title: 'Previous Availibility',
        description: '<div id="main" style="width: 300px;height:200px;"></div><button class="btn" type="button" onclick="basicInfo(' + number + ',' + lat + ',' + lng + ')">basic info</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button class="btn" type="button" onclick="jumpPredict(' + number + ',' + lat + ',' + lng + ')">prediction</button>',
        location0: loc,
        lat0: lat,
        lng0: lng
    };

    previousChart(userPin, number);

}

function basicInfo(number, lat, lng) {
    regetStations(number);
}

function regetStations(number) {
    $.ajax({
        url: "/stations",
        type: "GET",
        dataType: "json",
        success: function (data) {
            for (var i = 0; i < data["stations"].length; i++) {
                if (data["stations"][i].number == number) {
                    reInitStations(data["stations"][i]);
                }
            }
        }
    });

}

function reInitStations(obj) {
    var number = obj.number;
    var name = obj.name;
    //console.log(obj[i].name)
    var lat = obj.lat;
    var lng = obj.lng;
    //var bike_stands = obj[i].bike_stands;
    var available_bike_stands = obj.available_bike_stands;
    var available_bikes = obj.available_bikes;
    var address = obj.address;
    var loc = new Microsoft.Maps.Location(lat, lng);
    var userPin;
    if (available_bikes != 0) {
        userPin = new Microsoft.Maps.Pushpin(map.getCenter(), {
            visible: false,
            color: Microsoft.Maps.Color.fromHex('#000D29'),
            roundClickableArea: true,
            width: "100px"
        });
    } else {
        userPin = new Microsoft.Maps.Pushpin(map.getCenter(), {
            visible: false,
            color: Microsoft.Maps.Color.fromHex('#AC2E03'),
            roundClickableArea: true,
            width: "100px"
        });
    }
    userPin.setLocation(loc);
    userPin.setOptions({
        visible: true
    });
    userPin.metadata = {
        title: 'Bike Station: ' + number,
        description: 'Station Name: ' + name + '<br/>Available Bike Stands: ' + available_bike_stands + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br/>Available Bikes: ' + available_bikes + '<br/>Address: ' + address + '<br/> <br/><button class="btn" type="button" onclick="jumpChart(' + number + ',' + lat + ',' + lng + ')">previous data</button>&nbsp;&nbsp;&nbsp;<button class="btn" type="button" onclick="jumpPredict(' + number + ',' + lat + ',' + lng + ')">prediction</button>',
        location0: loc,
        lat0: lat,
        lng0: lng
    };
    infobox.setOptions({
        location: userPin.metadata.location0,
        title: userPin.metadata.title,
        description: userPin.metadata.description,
        visible: true,
    });

}

function getPreviousData(number) {
    $.ajax({
        url: "/station_occupancy_timeline/" + number,
        type: "GET",
        dataType: "json",
        success: function (data) {
            //insert chart
            createChart(data);
        }
    });

}

function previousChart(e, number) {
    //Make sure the infobox has metadata to display.
    if (e.metadata) {
        //Set the infobox options with the metadata of the pushpin.
        infobox.setOptions({
            location: e.metadata.location0,
            title: e.metadata.title,
            description: e.metadata.description,
            visible: true,
        });
    }
    //call /station_occupancy_timeline/<int:station_id>
    getPreviousData(number);

}

function jumpPredict(number, lat, lng) {
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
        title: 'Prediction',
        description: '<div style="width: 300px;height:200px;">Prediction Time: <input id="date" type="date"><br/> <br/><button class="btn" type="button" onclick="predictData(' + number + ',' + lat + ',' + lng + ')">Get Prediction</button> <br/> <br/><span id="result"></span></div>' + '<button class="btn" type="button" onclick="basicInfo(' + number + ',' + lat + ',' + lng + ')">basic info</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button class="btn" type="button" onclick="jumpChart(' + number + ',' + lat + ',' + lng + ')">previous data</button>',
        location0: loc,
        lat0: lat,
        lng0: lng
    };
    predictData(number, lat, lng);
    previousChart(userPin, number);
}

function predictData(number, lat, lng) {

    var date = $("#date").val();
    if (date != null) {
        $.ajax({
            url: "/prediction",
            data: {
                date: date,
                number: number,
                lat: lat,
                lng: lng
            },
            type: "POST",
            dataType: "json",
            success: function (data) {
                $("#result").empty();
                $("#result").append("Predicted available bikes: " + data.result);
            }
        });
    }
}

function transformJson(data) {
    var avl_stands_list = [];
    var avl_bikes_list = [];
    var dates = [];
    for (var i = 0; i < data.length; i++) {
        avl_stands_list.append(data[i].available_bike_stands);
        avl_bikes_list.append(data[i].available_bikes);
        dates.append(data[i].date);
    }

}

function createChart(data_json) {
    var avl_stands_list = [];
    var avl_bikes_list = [];
    var dates = [];
    for (var i = 0; i < data_json.length; i++) {
        avl_stands_list.push(data_json[i].available_bike_stands);
        avl_bikes_list.push(data_json[i].available_bikes);
        dates.push(data_json[i].date);
    }

    var myChart = echarts.init(document.getElementById('main'));
    var option = {
        legend: {
            data: ['available bike stands', 'available bikes']
        },
        xAxis: {
            type: 'category',
            data: dates
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            name: 'available bike stands',
            data: avl_stands_list,
            type: 'line'
        }, {
            name: 'available bikes',
            data: avl_bikes_list,
            type: 'line'
        }]
    };
    myChart.setOption(option);
}




function initStations(obj) {
    for (var i = 0; i < obj.length; i++) {
        var number = obj[i].number;
        var name = obj[i].name;
        //console.log(obj[i].name)
        var lat = obj[i].lat;
        var lng = obj[i].lng;
        //var bike_stands = obj[i].bike_stands;
        var available_bike_stands = obj[i].available_bike_stands;
        var available_bikes = obj[i].available_bikes;
        var address = obj[i].address;
        var loc = new Microsoft.Maps.Location(lat, lng);
        var userPin;
        if (available_bikes != 0) {
            userPin = new Microsoft.Maps.Pushpin(map.getCenter(), {
                visible: false,
                color: Microsoft.Maps.Color.fromHex('#000D29'),
                roundClickableArea: true,
                width: "100px"
            });
        } else {
            userPin = new Microsoft.Maps.Pushpin(map.getCenter(), {
                visible: false,
                color: Microsoft.Maps.Color.fromHex('#AC2E03'),
                roundClickableArea: true,
                width: "100px"
            });
        }
        userPin.setLocation(loc);
        userPin.setOptions({
            visible: true
        });
        userPin.metadata = {
            title: 'Bike Station: ' + number,
            description: 'Station Name: ' + name + '<br/>Available Bike Stands: ' + available_bike_stands + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br/>Available Bikes: ' + available_bikes + '<br/>Address: ' + address + '<br/> <br/><button class="btn" type="button" onclick="jumpChart(' + number + ',' + lat + ',' + lng + ',\'previousChart\')">previous data</button>&nbsp;&nbsp;&nbsp;<button class="btn" type="button" onclick="jumpPredict(' + number + ',' + lat + ',' + lng + ')">prediction</button>',
            location0: loc,
            lat0: lat,
            lng0: lng
        };

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
