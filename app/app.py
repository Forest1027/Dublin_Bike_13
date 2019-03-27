from flask import Flask, g, jsonify
from flask.templating import render_template
import sqlalchemy as sqla
from sqlalchemy import create_engine
import json
import sqlite3
import pymysql
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