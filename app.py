from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import pickle
import os


# =========================================================
# CREATE FLASK APPLICATION
# =========================================================

app = Flask(__name__)

# Allow requests from your VS Code frontend
CORS(app)


# =========================================================
# LOAD MACHINE LEARNING MODEL
# =========================================================

MODEL_PATH = "career_ai_model.pkl"

METADATA_PATH = "career_ai_metadata.pkl"


if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        "career_ai_model.pkl was not found."
    )


with open(MODEL_PATH, "rb") as file:

    model = pickle.load(file)


# =========================================================
# LOAD MODEL METADATA
# =========================================================

metadata = None


if os.path.exists(METADATA_PATH):

    with open(METADATA_PATH, "rb") as file:

        metadata = pickle.load(file)


print("Machine learning model loaded successfully.")


if metadata:

    print(
        "Model:",
        metadata.get("model_name")
    )

    print(
        "Expected features:",
        metadata.get("features")
    )


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "message":
            "CareerAI API is running successfully.",

        "status":
            "online"

    })


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({

        "status":
            "healthy",

        "model_loaded":
            model is not None

    })


# =========================================================
# CAREER PREDICTION
# =========================================================

@app.route(
    "/api/predict-role",
    methods=["POST"]
)
def predict_role():

    try:

        # -------------------------------------------------
        # GET JSON DATA
        # -------------------------------------------------

        data = request.get_json()


        if not data:

            return jsonify({

                "error":
                    "No JSON data received."

            }), 400


        # -------------------------------------------------
        # EXPECTED FEATURES
        # -------------------------------------------------

        required_features = [

            "Education",

            "Experience_Years",

            "Projects_Count",

            "Certification",

            "Python",

            "JavaScript",

            "SQL",

            "Machine_Learning",

            "Java",

            "HTML_CSS"

        ]


        # -------------------------------------------------
        # CHECK MISSING FEATURES
        # -------------------------------------------------

        missing_features = [

            feature

            for feature in required_features

            if feature not in data

        ]


        if missing_features:

            return jsonify({

                "error":
                    "Missing required features.",

                "missing_features":
                    missing_features

            }), 400


        # -------------------------------------------------
        # CREATE DATAFRAME
        # -------------------------------------------------

        user_data = {

            feature:
                data.get(feature)

            for feature in required_features

        }


        user_df = pd.DataFrame(
            [user_data]
        )


        # -------------------------------------------------
        # MAKE PREDICTION
        # -------------------------------------------------

        prediction = model.predict(
            user_df
        )[0]


        # -------------------------------------------------
        # GET PROBABILITIES
        # -------------------------------------------------

        recommendations = []


        if hasattr(
            model,
            "predict_proba"
        ):

            probabilities = (
                model.predict_proba(
                    user_df
                )[0]
            )


            classes = (
                model.classes_
            )


            ranked = sorted(

                zip(
                    classes,
                    probabilities
                ),

                key=lambda x: x[1],

                reverse=True

            )


            recommendations = [

                {

                    "career":
                        career,

                    "probability":
                        round(
                            float(probability)
                            * 100,
                            2
                        )

                }

                for career, probability
                in ranked

            ]


        # -------------------------------------------------
        # RETURN RESPONSE
        # -------------------------------------------------

        return jsonify({

            "success":
                True,

            "predicted_career":
                prediction,

            "recommendations":
                recommendations

        })


    except Exception as error:

        print(
            "Prediction error:",
            error
        )


        return jsonify({

            "success":
                False,

            "error":
                str(error)

        }), 500


# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )