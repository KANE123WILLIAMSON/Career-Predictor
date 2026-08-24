import requests


url = "http://127.0.0.1:5000/api/predict-role"


data = {

    "Education": "B.Tech",

    "Experience_Years": 1,

    "Projects_Count": 3,

    "Certification": "Coursera",

    "Python": 1,

    "JavaScript": 1,

    "SQL": 1,

    "Machine_Learning": 1,

    "Java": 0,

    "HTML_CSS": 1

}


response = requests.post(

    url,

    json=data

)


print(
    "Status:",
    response.status_code
)


print(
    "Response:"
)

print(
    response.json()
)