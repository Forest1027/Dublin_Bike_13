from flask import Flask, g, jsonify, request as req
from flask.templating import render_template
import sqlalchemy as sqla
from sqlalchemy import create_engine
import json
import pandas as pd
import sqlite3
import pymysql
pymysql.install_as_MySQLdb()
import decimal
import math
import time
import requests


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

# get station list
@app.route("/stations")
def get_stations():
    time1 = time.time();
    # return a list of all stations
    stations = []
    # db connection
    conn = get_db()
    rows = conn.execute("select * from (SELECT s.number,s.name,s.address,s.lat,s.lng,s.banking,s.bonus,s.status,a.available_bike_stands,a.available_bikes,a.last_update FROM dbbikes.stations s left join dbbikes.availability a on s.number=a.number order by a.last_update desc) t group by number;")
    stations = [dict(row) for row in rows]
    time2 = time.time()
    # print log to see the time taken
    print('stations time:', (time2 - time1))
    return jsonify(stations=stations)

# get historical data of a specific station
@app.route("/station_occupancy_timeline/<int:station_id>")
def get_station_occupancy_timeline(station_id):
    time1 = time.time()
    data = []
    # db connection
    conn = get_db()
    # retrieve hitorical details according to the station id
    rows = conn.execute('select a.number,avg(a.available_bike_stands) available_bike_stands, avg(a.available_bikes) available_bikes,from_unixtime(a.last_update/1000,"%%%%m-%%%%d") date from dbbikes.availability a where a.number= %s group by from_unixtime(a.last_update/1000,"%%%%Y-%%%%m-%%%%d");' % station_id)
    time3 = time.time()
    for row in rows:
        data.append(dict(row))
    
    time2 = time.time()
    print("station_occupancy:", (time2 - time3))
    return json.dumps(data, cls=DecimalEncoder)

# get availability prediction
@app.route("/prediction", methods=['POST'])
def prediction():
    time1 = time.time()
    # get all the relevant data from request
    date = req.form["date"]
    number = req.form["number"]
    lat = req.form["lat"]
    lng = req.form["lng"]
    time4 = time.time()
    # get weather info
    response = requests.get('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lng + '&appid=0414cbe308f8d767feb72165eb4e4c86')
    tep = response.text
    weather = json.loads(tep)
    print('weather------------',weather)
    weather_id = weather['weather'][0]['id']
    
    # transfer the date string to unix time
    ts = time.strptime(date, "%Y-%m-%d")
    date_uni = time.mktime(ts)
    print('date:', date, date_uni)
    
    time3 = time.time()
    print('gather data:', (time3 - time4))
    
    # db connection
    conn = get_db()
    # get available stands
    rows = conn.execute('select a.available_bike_stands from dbbikes.availability a where a.number=%s order by last_update desc limit 1;' % number)
    available_bike_stands = 0;
    for row in rows:
        available_bike_stands = row[0]
   
    # call the prediction formula to get predicted result
    result = predict_model(int(number), date_uni * 1000, weather_id, available_bike_stands)
    time2 = time.time()
    print("prediction:", (time2 - time1))
    return jsonify(result=result)

# prediction formula
def predict_model(number, time, weather, available_bike_stands):
    available_bike_predicting = 3.52480075 * math.pow(10, -4) * weather - 8.10009688 * math.pow(10, -1) * available_bike_stands + 1.17113224 * math.pow(10, -1) * number + 2.74978516 * math.pow(10, -12) * time + 16.39419983
    if available_bike_predicting < 0:
        available_bike_predicting = 0
    else:
        available_bike_predicting = round(available_bike_predicting)
    return available_bike_predicting
   

# solve error: Object of type 'Decimal' is not JSON serializable
# https://hexiangyu.me/2017/11/11/python-json-encode/
class DecimalEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# db connection
def get_db():
    URI = "dbikes.co1broeij4wf.us-east-1.rds.amazonaws.com"
    PORT = "3306"
    DB = "dbbikes"
    USER = "elaine"
    PASSWORD = "66666666"
    engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER, PASSWORD, URI, PORT, DB), echo=True)
    return engine


if __name__ == '__main__':
    app.run(host="0.0.0.0",port=80)
