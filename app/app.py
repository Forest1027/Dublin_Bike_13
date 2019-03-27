from flask import Flask, g, jsonify
from flask.templating import render_template
import sqlalchemy as sqla
from sqlalchemy import create_engine
import json
import pandas as pd
import sqlite3
import pymysql
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
    rows = conn.execute("SELECT * from stations;")
    for row in rows:
        stations.append(dict(row))
    return jsonify(stations=stations)

@app.route("/station_occupancy_timeline/<int:station_id>")
def get_station_occupancy_timeline(station_id):
    conn = get_db()
    df = pd.read_sql_query(sql="select * from availability where number = %s"%station_id, con=conn)
    
    df['last_update_date']=pd.to_datetime(df.last_update,unit="ms")
    df.set_index('last_update_date',inplace=True)
    sample='1h'
    occupancy=df['available_bike_stands'].resample(sample).mean()
    availability=df['available_bikes'].resample(sample).mean()
    print(availability,"---")
    return jsonify(occupancy=occupancy.to_json(),availability=availability.to_json())

def get_db():
    URI="dbikes.cojxe4plci1a.us-east-1.rds.amazonaws.com"
    PORT="3306"
    DB="dbikes"
    USER="forest"
    PASSWORD="66666666"
    engine=create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER,PASSWORD,URI,PORT,DB),echo=True)
    return engine

if __name__ == '__main__':
    app.run(debug=True)