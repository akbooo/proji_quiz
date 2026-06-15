import streamlit as st
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials

# --- Auth ---
scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = Credentials.from_service_account_file(
    "credentials.json",
    scopes=scopes
)

client = gspread.authorize(creds)

# --- Load sheet ---
@st.cache_data(ttl=60)  # обновление каждую минуту
def load_data():
    sheet = client.open("Proji").sheet1
    data = sheet.get_all_records()
    return pd.DataFrame(data)

df = load_data()

st.write(df)