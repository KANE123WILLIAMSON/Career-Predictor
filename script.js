/* =========================================================
   CAREER AI
   FRONTEND JAVASCRIPT
   CONNECTED TO FLASK ML API
   ========================================================= */


/* =========================================================
   1. GET HTML ELEMENTS
   ========================================================= */

const careerForm =
    document.getElementById("career-form");

const educationSelect =
    document.getElementById("education");

const experienceSelect =
    document.getElementById("experience");

const projectsInput =
    document.getElementById("projects");

const certificationSelect =
    document.getElementById("certification");

const skillCheckboxes =
    document.querySelectorAll(
        'input[name="skills"]'
    );


/* =========================================================
   2. FORM SUBMISSION
   ========================================================= */

careerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        /* -------------------------------------------------
           COLLECT DATA
        ------------------------------------------------- */

        const formData =
            collectFormData();


        /* -------------------------------------------------
           VALIDATE DATA
        ------------------------------------------------- */

        const validationError =
            validateFormData(formData);


        if (validationError) {

            showMessage(
                validationError.message,
                "error"
            );


            if (validationError.element) {

                validationError.element.focus();

            }


            return;

        }


        /* -------------------------------------------------
           LOADING STATE
        ------------------------------------------------- */

        const submitButton =
            document.querySelector(
                ".form-button"
            );


        const originalButtonText =
            submitButton.textContent;


        submitButton.disabled = true;


        submitButton.textContent =
            "Analyzing...";


        /* =================================================
           SEND DATA TO FLASK
        ================================================= */

        try {

            const result =
                await predictCareer(
                    formData
                );


            /* ---------------------------------------------
               CHECK API RESPONSE
            --------------------------------------------- */

            if (!result.success) {

                let errorMessage =
                    result.error ||
                    "Prediction failed.";


                if (
                    result.missing_features &&
                    result.missing_features.length > 0
                ) {

                    errorMessage +=
                        " Missing: " +
                        result.missing_features.join(
                            ", "
                        );

                }


                showMessage(
                    errorMessage,
                    "error"
                );


                return;

            }


            /* ---------------------------------------------
               GET PREDICTION
            --------------------------------------------- */

            const predictedCareer =
                result.predicted_career;


            const recommendations =
                result.recommendations || [];


            /* ---------------------------------------------
               DISPLAY PREDICTION
            --------------------------------------------- */

            displayMLRecommendation(
                predictedCareer,
                recommendations
            );

        }


        catch (error) {

            console.error(
                "API connection error:",
                error
            );


            showMessage(
                "Could not connect to the CareerAI backend. " +
                "Make sure app.py is running on " +
                "http://127.0.0.1:5000.",
                "error"
            );

        }


        finally {

            /* ---------------------------------------------
               RESTORE BUTTON
            --------------------------------------------- */

            submitButton.disabled = false;


            submitButton.textContent =
                originalButtonText;

        }

    }
);


/* =========================================================
   3. COLLECT FORM DATA
   ========================================================= */

function collectFormData() {


    /* -----------------------------------------------------
       GET SELECTED SKILLS
    ----------------------------------------------------- */

    const selectedSkills =
        Array.from(
            skillCheckboxes
        )
        .filter(
            function (checkbox) {

                return checkbox.checked;

            }
        )
        .map(
            function (checkbox) {

                return checkbox.value;

            }
        );


    /* =====================================================
       CREATE DATA FOR ML MODEL
       =====================================================

       IMPORTANT:

       The Flask backend expects:

       Education
       Experience_Years
       Projects_Count
       Certification
       Python
       JavaScript
       SQL
       Machine_Learning
       Java
       HTML_CSS
    */


    const data = {


        /* -----------------------------------------------
           EDUCATION
        ----------------------------------------------- */

        Education:
            educationSelect.value,


        /* -----------------------------------------------
           EXPERIENCE
        ----------------------------------------------- */

        Experience_Years:
            Number(
                experienceSelect.value
            ),


        /* -----------------------------------------------
           PROJECTS
        ----------------------------------------------- */

        Projects_Count:
            Number(
                projectsInput.value
            ),


        /* -----------------------------------------------
           CERTIFICATION

           Yes = 1
           No  = 0
        ----------------------------------------------- */

        Certification:
            certificationSelect.value === "Yes"
                ? 1
                : 0,


        /* -----------------------------------------------
           PYTHON

           Selected     = 1
           Not selected = 0
        ----------------------------------------------- */

        Python:
            selectedSkills.includes("python")
                ? 1
                : 0,


        /* -----------------------------------------------
           JAVASCRIPT
        ----------------------------------------------- */

        JavaScript:
            selectedSkills.includes("javascript")
                ? 1
                : 0,


        /* -----------------------------------------------
           SQL
        ----------------------------------------------- */

        SQL:
            selectedSkills.includes("sql")
                ? 1
                : 0,


        /* -----------------------------------------------
           MACHINE LEARNING
        ----------------------------------------------- */

        Machine_Learning:
            selectedSkills.includes(
                "machine-learning"
            )
                ? 1
                : 0,


        /* -----------------------------------------------
           JAVA
        ----------------------------------------------- */

        Java:
            selectedSkills.includes("java")
                ? 1
                : 0,


        /* -----------------------------------------------
           HTML / CSS
        ----------------------------------------------- */

        HTML_CSS:
            selectedSkills.includes("html-css")
                ? 1
                : 0

    };


    /* =====================================================
       SHOW DATA IN BROWSER CONSOLE
    ===================================================== */

    console.log(
        "Data being sent to Flask:"
    );


    console.log(data);


    return data;

}


/* =========================================================
   4. VALIDATE FORM DATA
   ========================================================= */

function validateFormData(data) {


    /* -----------------------------------------------------
       EDUCATION
    ----------------------------------------------------- */

    if (!data.Education) {

        return {

            message:
                "Please select your education.",

            element:
                educationSelect

        };

    }


    /* -----------------------------------------------------
       EXPERIENCE
    ----------------------------------------------------- */

    if (
        Number.isNaN(
            data.Experience_Years
        )
    ) {

        return {

            message:
                "Please select your experience.",

            element:
                experienceSelect

        };

    }


    /* -----------------------------------------------------
       PROJECTS
    ----------------------------------------------------- */

    if (
        Number.isNaN(
            data.Projects_Count
        )
        ||
        data.Projects_Count < 0
    ) {

        return {

            message:
                "Please enter a valid number of projects.",

            element:
                projectsInput

        };

    }


    /* -----------------------------------------------------
       CERTIFICATION
    ----------------------------------------------------- */

    if (
        certificationSelect.value !== "Yes" &&
        certificationSelect.value !== "No"
    ) {

        return {

            message:
                "Please select your certification status.",

            element:
                certificationSelect

        };

    }


    /* -----------------------------------------------------
       SKILLS
    ----------------------------------------------------- */

    const hasSkill =
        data.Python === 1 ||
        data.JavaScript === 1 ||
        data.SQL === 1 ||
        data.Machine_Learning === 1 ||
        data.Java === 1 ||
        data.HTML_CSS === 1;


    if (!hasSkill) {

        return {

            message:
                "Please select at least one skill."

        };

    }


    return null;

}


/* =========================================================
   5. CALL FLASK REST API
   ========================================================= */

async function predictCareer(data) {


    console.log(
        "Sending request to Flask..."
    );


    /* -----------------------------------------------------
       SEND POST REQUEST
    ----------------------------------------------------- */

    const response =
        await fetch(
            "http://127.0.0.1:5000/api/predict-role",
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(data)

            }
        );


    /* -----------------------------------------------------
       GET JSON RESPONSE
    ----------------------------------------------------- */

    const result =
        await response.json();


    console.log(
        "Flask response:"
    );


    console.log(result);


    /* -----------------------------------------------------
       HANDLE HTTP ERROR
    ----------------------------------------------------- */

    if (!response.ok) {

        return {

            success:
                false,

            error:
                result.error ||
                "The Flask API returned an error.",

            missing_features:
                result.missing_features || []

        };

    }


    return result;

}


/* =========================================================
   6. DISPLAY ML RECOMMENDATION
   ========================================================= */

function displayMLRecommendation(
    predictedCareer,
    recommendations
) {


    /* -----------------------------------------------------
       MAIN RESULT
    ----------------------------------------------------- */

    let message =
        `Your best career match is ${predictedCareer}.`;


    /* -----------------------------------------------------
       TOP PROBABILITY
    ----------------------------------------------------- */

    if (
        recommendations.length > 0
    ) {

        const topRecommendation =
            recommendations[0];


        if (
            topRecommendation.probability !== undefined
        ) {

            message +=
                ` Match probability: ` +
                `${topRecommendation.probability}%.`;

        }

    }


    /* -----------------------------------------------------
       OTHER RECOMMENDATIONS
    ----------------------------------------------------- */

    if (
        recommendations.length > 1
    ) {

        const otherCareers =
            recommendations

                .slice(1, 4)

                .map(
                    function (item) {

                        return (
                            `${item.career} ` +
                            `(${item.probability}%)`
                        );

                    }
                )

                .join(", ");


        message +=
            ` Other recommendations: ` +
            `${otherCareers}.`;

    }


    /* -----------------------------------------------------
       DISPLAY RESULT
    ----------------------------------------------------- */

    showMessage(
        message,
        "success"
    );


    /* -----------------------------------------------------
       CONSOLE OUTPUT
    ----------------------------------------------------- */

    console.log(
        "Career Recommendation:"
    );


    console.log(
        predictedCareer
    );


    console.log(
        "Recommendations:"
    );


    console.log(
        recommendations
    );


    /* -----------------------------------------------------
       SCROLL TO ASSESSMENT
    ----------------------------------------------------- */

    const assessmentSection =
        document.getElementById(
            "assessment"
        );


    if (assessmentSection) {

        assessmentSection.scrollIntoView({

            behavior:
                "smooth"

        });

    }

}


/* =========================================================
   7. SHOW MESSAGE
   ========================================================= */

function showMessage(
    message,
    type
) {


    /* -----------------------------------------------------
       REMOVE EXISTING MESSAGE
    ----------------------------------------------------- */

    const existingMessage =
        document.querySelector(
            ".form-message"
        );


    if (existingMessage) {

        existingMessage.remove();

    }


    /* -----------------------------------------------------
       CREATE MESSAGE
    ----------------------------------------------------- */

    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        `form-message ${type}`;


    messageElement.textContent =
        message;


    /* -----------------------------------------------------
       MESSAGE STYLE
    ----------------------------------------------------- */

    messageElement.style.gridColumn =
        "1 / -1";


    messageElement.style.padding =
        "14px 16px";


    messageElement.style.borderRadius =
        "8px";


    messageElement.style.fontSize =
        "13px";


    messageElement.style.fontWeight =
        "600";


    /* -----------------------------------------------------
       ERROR STYLE
    ----------------------------------------------------- */

    if (
        type === "error"
    ) {

        messageElement.style.background =
            "#fef2f2";


        messageElement.style.color =
            "#dc2626";


        messageElement.style.border =
            "1px solid #fecaca";

    }


    /* -----------------------------------------------------
       SUCCESS STYLE
    ----------------------------------------------------- */

    if (
        type === "success"
    ) {

        messageElement.style.background =
            "#f0fdf4";


        messageElement.style.color =
            "#15803d";


        messageElement.style.border =
            "1px solid #bbf7d0";

    }


    /* -----------------------------------------------------
       ADD MESSAGE TO FORM
    ----------------------------------------------------- */

    careerForm.prepend(
        messageElement
    );


    /* -----------------------------------------------------
       REMOVE AFTER 5 SECONDS
    ----------------------------------------------------- */

    setTimeout(
        function () {

            if (
                messageElement &&
                messageElement.parentNode
            ) {

                messageElement.remove();

            }

        },
        5000
    );

}


/* =========================================================
   8. NAVIGATION LINKS
   ========================================================= */

const navLinks =
    document.querySelectorAll(
        ".nav-links a"
    );


navLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                const targetId =
                    link.getAttribute(
                        "href"
                    );


                if (
                    targetId &&
                    targetId.startsWith("#")
                ) {

                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (target) {

                        target.scrollIntoView({

                            behavior:
                                "smooth"

                        });

                    }

                }

            }
        );

    }
);


/* =========================================================
   9. LOGIN / GET STARTED BUTTONS
   ========================================================= */

const navButtons =
    document.querySelectorAll(
        ".nav-buttons a"
    );


navButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                showMessage(
                    "Authentication will be added in the next stage.",
                    "success"
                );


                careerForm.scrollIntoView({

                    behavior:
                        "smooth"

                });

            }
        );

    }
);


/* =========================================================
   10. INITIAL PAGE LOAD
   ========================================================= */

console.log(
    "CareerAI frontend loaded successfully."
);


console.log(
    "CareerAI is connected to the Flask ML API."
);