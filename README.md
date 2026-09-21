# Excel Vault

A simple web-based Excel file management system built using **HTML, CSS, JavaScript, Google Apps Script, Google Sheets, GitHub, and GitHub Pages**.

Users can register and log in, upload Excel/CSV files, and download their previously uploaded files. Each user receives a randomly generated unique User ID, and files are separated by User ID and upload date.

---

## Features

* User registration
* User login using phone number and password
* Random unique User ID for every account
* User account data stored in Google Sheets
* Password hashing before storage
* Session-based authentication
* Excel file upload
* CSV file upload
* Files stored publicly in GitHub
* Files separated by User ID
* Files organized by upload date
* Download files from the website
* Responsive and simple UI
* GitHub Pages hosting
* Google Apps Script backend
* GitHub Actions deployment
* Apps Script URL injected during deployment
* GitHub write token kept on the backend

---

# Technology Stack

| Component       | Technology                          |
| --------------- | ----------------------------------- |
| Frontend        | HTML                                |
| Styling         | CSS                                 |
| Frontend Logic  | JavaScript                          |
| Backend         | Google Apps Script                  |
| User Database   | Google Sheets                       |
| File Storage    | GitHub Repository                   |
| Website Hosting | GitHub Pages                        |
| Deployment      | GitHub Actions                      |
| Authentication  | Custom session-based authentication |

No frontend framework is required.

---

# Project Architecture

```text
                         USER
                           |
                           v
                  +-------------------+
                  |    GitHub Pages   |
                  |                   |
                  | HTML              |
                  | CSS               |
                  | JavaScript        |
                  +---------+---------+
                            |
                            | API requests
                            v
                  +-------------------+
                  | Google Apps Script|
                  |                   |
                  | Authentication    |
                  | Session handling  |
                  | File upload       |
                  | File listing      |
                  +----+---------+----+
                       |         |
                       |         |
                       v         v
                +----------+  +---------+
                |  Google  |  | GitHub  |
                |  Sheets  |  |         |
                |          |  | Excel   |
                | Accounts |  | Files   |
                +----------+  +---------+
```

---

# Repository Structure

```text
excel-vault/
│
├── index.html
├── style.css
├── app.js
├── api.js
├── config.js
│
├── files/
│   └── .gitkeep
│
└── .github/
    └── workflows/
        └── deploy.yml
```

---

# File Responsibilities

## `index.html`

Contains the complete website structure.

Includes:

* Login form
* Registration form
* Dashboard
* Upload section
* Download section
* File selection area

---

## `style.css`

Contains all website styling.

Includes:

* Authentication page
* Dashboard
* Upload interface
* Download interface
* Responsive design
* Mobile layout

---

## `app.js`

Contains frontend application logic.

Handles:

* Registration
* Login
* Logout
* Session restoration
* File selection
* Drag and drop
* File upload
* File listing
* Download interface

---

## `api.js`

Contains the frontend API communication layer.

It communicates with Google Apps Script.

Available API functions:

```text
register()
login()
validateSession()
logout()
uploadFile()
listFiles()
```

---

## `config.js`

Contains the Google Apps Script API URL.

The repository contains only a template:

```javascript
"use strict";

const APP_CONFIG = Object.freeze({
    API_URL: "__API_URL__"
});
```

The real Apps Script URL is generated automatically during GitHub Actions deployment.

The real URL should not be manually committed to the repository.

---

# User Account System

Users register using:

```text
Name
Phone
Email
Password
```

Login requires:

```text
Phone
Password
```

A unique User ID is automatically generated during registration.

Example:

```text
USR_7A31F82C91D4
```

The User ID is random and is not generated from:

* Name
* Phone number
* Email address

---

# Google Sheets Database

Google Apps Script automatically creates a sheet named:

```text
Users
```

The columns are:

```text
User ID
Name
Phone
Email
Password Hash
Salt
Created At
```

Example:

| User ID          | Name  | Phone      | Email                                       |
| ---------------- | ----- | ---------- | ------------------------------------------- |
| USR_7A31F82C91D4 | Tarun | 9876543210 | [user@example.com](mailto:user@example.com) |

Passwords are not stored as plain text.

---

# File Storage Structure

Uploaded files are stored in the GitHub repository using this structure:

```text
files/
└── USER_ID/
    └── YYYY-MM-DD/
        └── filename.xlsx
```

Example:

```text
files/
├── USR_7A31F82C91D4/
│   ├── 2026-09-21/
│   │   ├── sales_A83F19C2.xlsx
│   │   └── attendance_91BD72FA.xlsx
│   │
│   └── 2026-09-22/
│       └── report_7F21A9B3.xlsx
│
└── USR_B8214A91C7E2/
    └── 2026-09-21/
        └── inventory_32AF81D4.xlsx
```

This keeps each user's files separated.

---

# Supported Files

The application currently supports:

```text
.xlsx
.xls
.csv
```

The frontend currently limits uploads to:

```text
8 MB
```

This limit is intended to keep the browser → Apps Script → GitHub upload flow practical.

---

# File Naming

When a file is uploaded, a random suffix is added to the filename.

For example:

```text
sales.xlsx
```

may become:

```text
sales_A83F19C2.xlsx
```

This prevents files with the same name from overwriting each other.

---

# Upload Flow

When a user uploads an Excel file:

```text
1. User selects file
        |
        v
2. Browser validates file type
        |
        v
3. Browser validates file size
        |
        v
4. File is converted to Base64
        |
        v
5. Browser sends file + session token
   to Google Apps Script
        |
        v
6. Apps Script validates the session
        |
        v
7. Apps Script obtains the User ID
   from the session
        |
        v
8. Apps Script creates:
   files/USER_ID/YYYY-MM-DD/
        |
        v
9. Apps Script uploads file to GitHub
        |
        v
10. GitHub stores the Excel file
```

---

# Download Flow

When the user opens the Download section:

```text
1. Browser sends session token
        |
        v
2. Google Apps Script validates session
        |
        v
3. Apps Script obtains User ID
        |
        v
4. Apps Script accesses:
   files/USER_ID/
        |
        v
5. Date folders are read
        |
        v
6. Files are collected
        |
        v
7. File information is returned
        |
        v
8. Website groups files by date
        |
        v
9. User clicks Download
```

The browser does not provide the User ID when requesting files.

The backend determines the User ID from the authenticated session.

---

# Google Apps Script Setup

## 1. Create Google Sheet

Create a new Google Sheet.

Example:

```text
Excel Vault Database
```

---

## 2. Open Apps Script

Inside Google Sheets:

```text
Extensions
    ↓
Apps Script
```

Replace the default code with the project's `Code.gs`.

---

# GitHub Configuration in Apps Script

Open:

```text
Apps Script
    ↓
Project Settings
    ↓
Script Properties
```

Add the following properties:

```text
GITHUB_TOKEN
GITHUB_OWNER
GITHUB_REPO
GITHUB_BRANCH
GITHUB_ROOT_FOLDER
```

Example:

```text
GITHUB_TOKEN       = github_pat_xxxxxxxxxxxxx
GITHUB_OWNER       = tarunmhanta
GITHUB_REPO        = excel-vault
GITHUB_BRANCH      = main
GITHUB_ROOT_FOLDER = files
```

---

# Creating the GitHub Token

Go to:

```text
GitHub
    ↓
Settings
    ↓
Developer settings
    ↓
Personal access tokens
    ↓
Fine-grained tokens
```

Create a token with access to the `excel-vault` repository.

Required repository permission:

```text
Contents → Read and write
```

The token is stored only in Google Apps Script Script Properties.

Do not put the token inside:

```text
index.html
app.js
api.js
config.js
```

Do not commit the token to GitHub.

---

# Apps Script Web App Deployment

In Google Apps Script:

```text
Deploy
    ↓
New deployment
```

Select:

```text
Type:
Web app
```

Use:

```text
Execute as:
Me
```

and:

```text
Who has access:
Anyone
```

Deploy the application.

Google Apps Script will provide a URL similar to:

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

This is the API URL used by the website.

---

# GitHub Actions Secret

The Apps Script URL is stored in GitHub Actions as a repository secret.

Go to:

```text
GitHub Repository
    ↓
Settings
    ↓
Secrets and variables
    ↓
Actions
    ↓
New repository secret
```

Create:

```text
Name:
API_URL
```

Value:

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

The GitHub Actions workflow reads this secret during deployment.

---

# Why `config.js` Does Not Contain the Real URL

The repository contains:

```javascript
const APP_CONFIG = Object.freeze({
    API_URL: "__API_URL__"
});
```

During deployment, GitHub Actions generates the actual `config.js` using:

```text
secrets.API_URL
```

The deployment process is:

```text
Repository
    |
    v
GitHub Actions
    |
    v
Read API_URL secret
    |
    v
Generate config.js
    |
    v
Deploy to GitHub Pages
```

Therefore, the real Apps Script URL does not need to be committed to the source repository.

Note that the Apps Script URL is not a credential. Once the website is running, a browser can discover the endpoint. The GitHub Personal Access Token is the sensitive credential and remains on the Apps Script backend.

---

# GitHub Actions Workflow

The deployment workflow is located at:

```text
.github/workflows/deploy.yml
```

It performs these steps:

```text
1. Checkout repository
2. Configure GitHub Pages
3. Generate config.js
4. Insert API_URL
5. Create Pages artifact
6. Deploy artifact to GitHub Pages
```

---

# GitHub Pages Setup

Go to:

```text
Repository
    ↓
Settings
    ↓
Pages
```

Under:

```text
Build and deployment
```

select:

```text
Source:
GitHub Actions
```

Push the project to the `main` branch.

GitHub Actions will automatically deploy the website.

---

# Authentication Flow

## Registration

```text
User
 |
 | Name
 | Phone
 | Email
 | Password
 v
Google Apps Script
 |
 v
Generate random User ID
 |
 v
Hash password
 |
 v
Save account to Google Sheets
```

---

## Login

```text
Phone + Password
       |
       v
Google Apps Script
       |
       v
Find user by phone
       |
       v
Verify password
       |
       v
Generate session token
       |
       v
Return session token
```

The session token is stored by the browser and used for authenticated operations.

---

# Session

The backend stores sessions using Google Apps Script `CacheService`.

The current session lifetime is:

```text
6 hours
```

After expiration, the user needs to log in again.

---

# Security Model

The system uses several protections:

### Passwords

Passwords are not stored as plain text.

A salt and repeated SHA-256 hashing are used before storing the password.

---

### User Isolation

The backend determines the User ID from the authenticated session.

The frontend cannot request another user's files simply by changing a User ID in the request.

---

### GitHub Token

The GitHub Personal Access Token is stored in Apps Script Script Properties.

It is never included in the frontend.

---

### Filename Sanitization

Uploaded filenames are sanitized before being used as GitHub paths.

Path traversal patterns such as:

```text
../
```

are removed.

---

### Unique File Names

A random suffix is added to uploaded filenames to reduce filename collisions.

---

# Important Architecture Notes

## Apps Script URL

The Apps Script URL is stored as a GitHub Actions secret so that it does not have to be hardcoded in the repository source.

However, it should not be considered a password or authentication credential because the deployed website needs to know the endpoint.

---

## GitHub Token

The GitHub token is sensitive.

It must remain inside:

```text
Google Apps Script → Script Properties
```

It must never be exposed to the browser.

---

## Excel Files

Excel files are intentionally stored in the GitHub repository and therefore are publicly accessible according to the repository's visibility.

Do not upload confidential or private documents to this system unless the storage architecture is changed to use private storage and authenticated downloads.

---

# First-Time Setup Checklist

Use this checklist when setting up the project.

## GitHub

* [ ] Create `excel-vault` repository
* [ ] Create `files` folder
* [ ] Add `.gitkeep`
* [ ] Add HTML/CSS/JS files
* [ ] Add `config.js` template
* [ ] Add `.github/workflows/deploy.yml`

---

## Google

* [ ] Create Google Sheet
* [ ] Open Apps Script
* [ ] Add `Code.gs`
* [ ] Configure Script Properties
* [ ] Create GitHub Personal Access Token
* [ ] Add GitHub token to Apps Script
* [ ] Deploy Apps Script as Web App
* [ ] Copy Apps Script URL

---

## GitHub Actions

* [ ] Open repository Settings
* [ ] Open Secrets and variables
* [ ] Open Actions
* [ ] Create `API_URL` secret
* [ ] Paste Apps Script URL
* [ ] Configure GitHub Pages to use GitHub Actions

---

## Testing

* [ ] Open GitHub Pages website
* [ ] Register a test user
* [ ] Check Google Sheet
* [ ] Login
* [ ] Upload `.xlsx`
* [ ] Check GitHub `files/` directory
* [ ] Open Download section
* [ ] Download uploaded file
* [ ] Test with a second user

---

# Example Final GitHub Structure

After a successful upload, the repository may look like:

```text
excel-vault/
│
├── index.html
├── style.css
├── app.js
├── api.js
├── config.js
│
├── files/
│   ├── USR_7A31F82C91D4/
│   │   ├── 2026-09-21/
│   │   │   ├── sales_A83F19C2.xlsx
│   │   │   └── attendance_91BD72FA.xlsx
│   │   │
│   │   └── 2026-09-22/
│   │       └── report_7F21A9B3.xlsx
│   │
│   └── USR_B8214A91C7E2/
│       └── 2026-09-21/
│           └── inventory_32AF81D4.xlsx
│
└── .github/
    └── workflows/
        └── deploy.yml
```

---

# Complete System Flow

```text
                    REGISTER
                       |
                       v
                Google Sheets
                       |
                 Generate User ID
                       |
                       v
                     LOGIN
                       |
                       v
                 Session Token
                       |
              +--------+--------+
              |                 |
              v                 v
           UPLOAD            DOWNLOAD
              |                 |
              v                 v
        Google Apps Script  Google Apps Script
              |                 |
              v                 v
           GitHub           User's folder
              |                 |
              v                 v
       files/USER_ID/       Date groups
       YYYY-MM-DD/              |
              |                 v
              v              Download
          Excel File
```

---

# Project Goal

Excel Vault is designed as a lightweight file management system without a traditional backend server or database.

The project uses:

```text
HTML
CSS
JavaScript
        +
Google Apps Script
        +
Google Sheets
        +
GitHub
        +
GitHub Pages
```

This keeps the project simple while providing user registration, authentication, date-based file organization, uploading, and downloading functionality.
