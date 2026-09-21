"use strict";


const state = {

    currentUser: null,

    sessionToken: null,

    selectedFile: null

};


const STORAGE = Object.freeze({

    SESSION:
        "excel_vault_session",

    USER:
        "excel_vault_user"

});


const MAX_FILE_SIZE =
    8 * 1024 * 1024;


// ============================================================
// DOM
// ============================================================

const authSection =
    document.getElementById(
        "authSection"
    );

const dashboardSection =
    document.getElementById(
        "dashboardSection"
    );

const loginForm =
    document.getElementById(
        "loginForm"
    );

const registerForm =
    document.getElementById(
        "registerForm"
    );

const showRegisterButton =
    document.getElementById(
        "showRegisterButton"
    );

const showLoginButton =
    document.getElementById(
        "showLoginButton"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const userGreeting =
    document.getElementById(
        "userGreeting"
    );

const uploadPanel =
    document.getElementById(
        "uploadPanel"
    );

const downloadPanel =
    document.getElementById(
        "downloadPanel"
    );

const uploadArea =
    document.getElementById(
        "uploadArea"
    );

const excelFile =
    document.getElementById(
        "excelFile"
    );

const selectedFileName =
    document.getElementById(
        "selectedFileName"
    );

const uploadButton =
    document.getElementById(
        "uploadButton"
    );

const uploadMessage =
    document.getElementById(
        "uploadMessage"
    );

const downloadList =
    document.getElementById(
        "downloadList"
    );


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    setupEventListeners();

    showLogin();

    await restoreSession();

}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    showRegisterButton.addEventListener(
        "click",
        showRegister
    );


    showLoginButton.addEventListener(
        "click",
        showLogin
    );


    loginForm.addEventListener(
        "submit",
        handleLogin
    );


    registerForm.addEventListener(
        "submit",
        handleRegister
    );


    logoutButton.addEventListener(
        "click",
        handleLogout
    );


    excelFile.addEventListener(
        "change",
        handleFileSelection
    );


    uploadArea.addEventListener(
        "click",
        () => excelFile.click()
    );


    uploadArea.addEventListener(
        "dragover",
        handleDragOver
    );


    uploadArea.addEventListener(
        "dragleave",
        handleDragLeave
    );


    uploadArea.addEventListener(
        "drop",
        handleDrop
    );


    uploadButton.addEventListener(
        "click",
        handleUpload
    );


    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const section =
                        card.dataset.section;

                    openDashboardSection(
                        section
                    );

                }
            );

        });

}


// ============================================================
// AUTH UI
// ============================================================

function showLogin() {

    loginForm.style.display =
        "block";

    registerForm.style.display =
        "none";

}


function showRegister() {

    loginForm.style.display =
        "none";

    registerForm.style.display =
        "block";

}


// ============================================================
// REGISTER
// ============================================================

async function handleRegister(event) {

    event.preventDefault();

    const name =
        document
            .getElementById(
                "registerName"
            )
            .value
            .trim();

    const phone =
        document
            .getElementById(
                "registerPhone"
            )
            .value
            .trim();

    const email =
        document
            .getElementById(
                "registerEmail"
            )
            .value
            .trim();

    const password =
        document
            .getElementById(
                "registerPassword"
            )
            .value;

    const confirmPassword =
        document
            .getElementById(
                "registerConfirmPassword"
            )
            .value;


    if (
        password !==
        confirmPassword
    ) {

        alert(
            "Passwords do not match."
        );

        return;
    }


    try {

        const result =
            await Api.register(
                name,
                phone,
                email,
                password
            );


        if (!result.success) {

            alert(
                result.message
            );

            return;
        }


        alert(
            "Account created successfully.\n\n" +
            "Your User ID is:\n" +
            result.user.userId
        );


        registerForm.reset();

        showLogin();


    } catch (error) {

        console.error(error);

        alert(
            error.message
        );

    }

}


// ============================================================
// LOGIN
// ============================================================

async function handleLogin(event) {

    event.preventDefault();

    const phone =
        document
            .getElementById(
                "loginPhone"
            )
            .value
            .trim();

    const password =
        document
            .getElementById(
                "loginPassword"
            )
            .value;


    try {

        const result =
            await Api.login(
                phone,
                password
            );


        if (!result.success) {

            alert(
                result.message
            );

            return;
        }


        state.sessionToken =
            result.sessionToken;

        state.currentUser =
            result.user;


        localStorage.setItem(
            STORAGE.SESSION,
            state.sessionToken
        );


        localStorage.setItem(
            STORAGE.USER,
            JSON.stringify(
                state.currentUser
            )
        );


        loginForm.reset();

        showDashboard();

    } catch (error) {

        console.error(error);

        alert(
            error.message
        );

    }

}


// ============================================================
// RESTORE SESSION
// ============================================================

async function restoreSession() {

    const savedToken =
        localStorage.getItem(
            STORAGE.SESSION
        );

    if (!savedToken) {
        return;
    }


    try {

        const result =
            await Api.validateSession(
                savedToken
            );


        if (
            !result.success
        ) {

            clearSession();

            return;
        }


        state.sessionToken =
            savedToken;

        state.currentUser =
            result.user;


        localStorage.setItem(
            STORAGE.USER,
            JSON.stringify(
                state.currentUser
            )
        );


        showDashboard();


    } catch (error) {

        console.error(
            "Session restore failed:",
            error
        );

        clearSession();

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function handleLogout() {

    try {

        if (state.sessionToken) {

            await Api.logout(
                state.sessionToken
            );

        }

    } catch (error) {

        console.error(error);

    } finally {

        clearSession();

        showLogin();

    }

}


function clearSession() {

    state.currentUser =
        null;

    state.sessionToken =
        null;

    state.selectedFile =
        null;


    localStorage.removeItem(
        STORAGE.SESSION
    );

    localStorage.removeItem(
        STORAGE.USER
    );

}


// ============================================================
// DASHBOARD
// ============================================================

function showDashboard() {

    authSection.style.display =
        "none";

    dashboardSection.style.display =
        "block";


    userGreeting.textContent =
        "Welcome, " +
        state.currentUser.name;


    openDashboardSection(
        "upload"
    );

}


function openDashboardSection(
    section
) {

    if (
        section === "upload"
    ) {

        uploadPanel.style.display =
            "block";

        downloadPanel.style.display =
            "none";

    }


    if (
        section === "download"
    ) {

        uploadPanel.style.display =
            "none";

        downloadPanel.style.display =
            "block";

        loadFiles();

    }

}


// ============================================================
// FILE SELECTION
// ============================================================

function handleFileSelection(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    selectFile(file);

}


function handleDragOver(event) {

    event.preventDefault();

    uploadArea.classList.add(
        "drag-over"
    );

}


function handleDragLeave(event) {

    event.preventDefault();

    uploadArea.classList.remove(
        "drag-over"
    );

}


function handleDrop(event) {

    event.preventDefault();

    uploadArea.classList.remove(
        "drag-over"
    );


    const file =
        event.dataTransfer.files[0];

    if (!file) {
        return;
    }

    selectFile(file);

}


function selectFile(file) {

    const fileName =
        file.name.toLowerCase();


    const validExtension =
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".xls") ||
        fileName.endsWith(".csv");


    if (!validExtension) {

        alert(
            "Please select an Excel or CSV file."
        );

        return;
    }


    if (
        file.size >
        MAX_FILE_SIZE
    ) {

        alert(
            "File size must be 8 MB or smaller."
        );

        return;
    }


    state.selectedFile =
        file;


    selectedFileName.textContent =
        file.name;


    uploadMessage.textContent =
        "File selected. Click Upload.";
}


// ============================================================
// PART 4 — UPLOAD
// ============================================================

async function handleUpload() {

    if (!state.selectedFile) {

        alert(
            "Please select a file first."
        );

        return;
    }


    if (!state.sessionToken) {

        alert(
            "Please login again."
        );

        return;
    }


    uploadButton.disabled =
        true;


    uploadMessage.textContent =
        "Preparing file...";


    try {

        const fileData =
            await fileToBase64(
                state.selectedFile
            );


        uploadMessage.textContent =
            "Uploading to GitHub...";


        const result =
            await Api.uploadFile(

                state.sessionToken,

                state.selectedFile.name,

                state.selectedFile.type,

                fileData

            );


        if (!result.success) {

            throw new Error(
                result.message
            );
        }


        uploadMessage.textContent =
            "Upload successful.";


        alert(
            "File uploaded successfully."
        );


        state.selectedFile =
            null;


        excelFile.value =
            "";


        selectedFileName.textContent =
            "No file selected";


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        uploadMessage.textContent =
            "Upload failed.";


        alert(
            error.message
        );

    } finally {

        uploadButton.disabled =
            false;

    }

}


function fileToBase64(file) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();


            reader.onload =
                () => resolve(
                    reader.result
                );


            reader.onerror =
                () => reject(
                    new Error(
                        "Unable to read file."
                    )
                );


            reader.readAsDataURL(
                file
            );

        }
    );

}


// ============================================================
// PART 5 — DOWNLOAD
// ============================================================

async function loadFiles() {

    if (!state.sessionToken) {
        return;
    }


    downloadList.innerHTML =
        `
        <div class="empty-state">
            Loading files...
        </div>
        `;


    try {

        const result =
            await Api.listFiles(
                state.sessionToken
            );


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        renderFiles(
            result.files || []
        );


    } catch (error) {

        console.error(
            "File loading error:",
            error
        );


        downloadList.innerHTML =
            `
            <div class="empty-state">
                Unable to load files.
            </div>
            `;

    }

}


function renderFiles(files) {

    if (!files.length) {

        downloadList.innerHTML =
            `
            <div class="empty-state">
                No files uploaded yet.
            </div>
            `;

        return;
    }


    /*
     * Group files by date.
     */

    const grouped =
        {};


    files.forEach(file => {

        if (!grouped[file.date]) {

            grouped[file.date] =
                [];

        }

        grouped[file.date].push(
            file
        );

    });


    let html = "";


    Object.keys(grouped)
        .sort()
        .reverse()
        .forEach(date => {

            html +=
                `
                <div class="file-date-group">

                    <h3>
                        ${escapeHtml(date)}
                    </h3>

                `;


            grouped[date].forEach(
                file => {

                    html +=
                        `
                        <div class="file-row">

                            <div class="file-info">

                                <strong>
                                    ${escapeHtml(
                                        file.name
                                    )}
                                </strong>

                                <span>
                                    ${formatFileSize(
                                        file.size
                                    )}
                                </span>

                            </div>

                            <a
                                class="download-button"
                                href="${escapeAttribute(
                                    file.downloadUrl
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>

                        </div>
                        `;

                }
            );


            html +=
                `
                </div>
                `;

        });


    downloadList.innerHTML =
        html;

}


// ============================================================
// HELPERS
// ============================================================

function formatFileSize(
    bytes
) {

    if (!bytes) {
        return "";
    }


    if (bytes < 1024) {
        return bytes + " B";
    }


    if (
        bytes <
        1024 * 1024
    ) {

        return (
            (bytes / 1024)
                .toFixed(1) +
            " KB"
        );

    }


    return (
        (bytes /
            (1024 * 1024))
            .toFixed(1) +
        " MB"
    );

}


function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}