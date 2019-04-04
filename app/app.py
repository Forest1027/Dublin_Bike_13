from flask import Flask, g, jsonify,request
from flask.templating import render_template
import sqlalchemy as sqla
from sqlalchemy import create_engine
import json
import pandas as pd
import sqlite3
import pymysql
import decimal
import urllib.request
import math
from unittest.mock import inplace
pymysql.install_as_MySQLdb()

app = Flask(__name__)
#app.config.from_object('config')

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/stations")
def get_stations():
    # return a list of all stations
    stations=[]
    conn = get_db()
    rows = conn.execute("select * from (SELECT s.number,s.name,s.address,s.lat,s.lng,s.banking,s.bonus,s.status,a.available_bike_stands,a.available_bikes,a.last_update FROM dbbikes.stations s left join dbbikes.availability a on s.number=a.number order by a.last_update desc) t group by number;")
    for row in rows:
        stations.append(dict(row))
    return jsonify(stations=stations)

@app.route("/station_occupancy_timeline/<int:station_id>")
def get_station_occupancy_timeline(station_id):
    data=[]
    conn = get_db()
    #rows = conn.execute('select a.number,avg(a.available_bike_stands) available_bike_stands, avg(a.available_bikes) available_bikes,from_unixtime(a.last_update/1000,"%Y-%m-%d") from dbikes.availability a group by from_unixtime(a.last_update/1000,"%Y-%m-%d");')
    
    rows = conn.execute('select a.number,avg(a.available_bike_stands) available_bike_stands, avg(a.available_bikes) available_bikes,from_unixtime(a.last_update/1000,"%%%%m-%%%%d") date from dbbikes.availability a where a.number= %s group by from_unixtime(a.last_update/1000,"%%%%Y-%%%%m-%%%%d");'%station_id)
    for row in rows:
        data.append(dict(row))
    return json.dumps(data, cls=DecimalEncoder)

@app.route("/prediction",methods=['POST'])
def prediction():
    date = request.form["date"]
    number = request.form["number"]
    lat = request.form["lat"]
    lng = request.form["lng"]
    # get weather info
    response = urllib.request.urlopen('http://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+lng+'&appid=0414cbe308f8d767feb72165eb4e4c86')
    tep2= json.dumps(response.read().decode('utf-8'))
    tep3=json.loads(tep2)
    weather=json.loads(tep3)
    weather_id=weather['weather'][0]['id']
    print('date:',date)
    conn = get_db()
    # get available stands
    rows = conn.execute('select a.available_bike_stands from dbbikes.availability a where a.number=%s order by last_update desc limit 1;'%number)
    available_bike_stands = 0;
    for row in rows:
        available_bike_stands = row[0]
    #print(type(number),type(weather_id),type(available_bike_stands),'-----------')
    #return jsonify(result=predict_model(number,date,weather,available_bike_stands)
    result=predict_model(int(number),1550842425000,weather_id,available_bike_stands)
    return jsonify(result=result)
    #return json.dumps(result, cls=DecimalEncoder)
   
def predict_model(number,time,weather,available_bike_stands):
    available_bike_predicting= 3.52480075*math.pow(10, -4)*weather-8.10009688*math.pow(10,-1)*available_bike_stands+1.17113224*math.pow(10,-1)*number+2.74978516*math.pow(10,-12)*time+16.39419983
    if available_bike_predicting<0:
        available_bike_predicting=0
    else:
        available_bike_predicting=round(available_bike_predicting)
    return available_bike_predicting
            
   

#solve error: Object of type 'Decimal' is not JSON serializable
#https://hexiangyu.me/2017/11/11/python-json-encode/
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_db():
    URI="dbikes.co1broeij4wf.us-east-1.rds.amazonaws.com"
    PORT="3306"
    DB="dbbikes"
    USER="elaine"
    PASSWORD="66666666"
    engine=create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER,PASSWORD,URI,PORT,DB),echo=True)
    return engine


if __name__ == '__main__':
    app.run(debug=True)