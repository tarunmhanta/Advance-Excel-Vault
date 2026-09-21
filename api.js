"use strict";

const Api = (() => {

    async function request(action, data = {}) {

        if (
            !APP_CONFIG.API_URL ||
            APP_CONFIG.API_URL.includes(
                "YOUR_GOOGLE_APPS_SCRIPT_URL"
            )
        ) {
            throw new Error(
                "Google Apps Script URL is not configured."
            );
        }

        const payload = {
            action,
            ...data
        };

        let response;

        try {

            response = await fetch(
                APP_CONFIG.API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        } catch (error) {

            console.error(
                "API connection error:",
                error
            );

            throw new Error(
                "Unable to connect to the server."
            );
        }

        if (!response.ok) {

            throw new Error(
                `Server error: HTTP ${response.status}`
            );
        }

        let result;

        try {

            result =
                await response.json();

        } catch (error) {

            console.error(
                "Invalid JSON response:",
                error
            );

            throw new Error(
                "Invalid response from server."
            );
        }

        if (
            !result ||
            typeof result.success !== "boolean"
        ) {

            throw new Error(
                "Invalid server response."
            );
        }

        return result;
    }


    async function register(
        name,
        phone,
        email,
        password
    ) {

        return request(
            "register",
            {
                name,
                phone,
                email,
                password
            }
        );
    }


    async function login(
        phone,
        password
    ) {

        return request(
            "login",
            {
                phone,
                password
            }
        );
    }


    async function validateSession(
        sessionToken
    ) {

        return request(
            "validateSession",
            {
                sessionToken
            }
        );
    }


    async function logout(
        sessionToken
    ) {

        return request(
            "logout",
            {
                sessionToken
            }
        );
    }


    // ========================================================
    // PART 4 — UPLOAD
    // ========================================================

    async function uploadFile(
        sessionToken,
        fileName,
        mimeType,
        fileData
    ) {

        return request(
            "uploadFile",
            {
                sessionToken,
                fileName,
                mimeType,
                fileData
            }
        );
    }


    // ========================================================
    // PART 5 — LIST FILES
    // ========================================================

    async function listFiles(
        sessionToken
    ) {

        return request(
            "listFiles",
            {
                sessionToken
            }
        );
    }


    return Object.freeze({

        register,
        login,
        validateSession,
        logout,

        uploadFile,
        listFiles

    });

})();