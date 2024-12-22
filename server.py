from flask import Flask, jsonify, render_template
import pandas as pd
from sqlalchemy import create_engine
import os

current_directory = os.path.dirname(os.path.abspath(__file__))
db_url = f'sqlite:///{current_directory}/demo.db'
engine = create_engine(db_url, echo=True)

df = pd.read_csv(current_directory + "/usa_schools.csv")
df.to_sql('usa_schools', con=engine, if_exists='replace', index=False)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-data/<string:query>')
def get_data(query:str):
    df = pd.read_sql(query, engine)
    data_json = df.to_dict(orient='records')

    return jsonify(data_json)

if __name__ == '__main__':
    app.run(debug=True)

