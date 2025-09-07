# GitLode

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**GitLode** is your precision tool for downloading specific GitHub directories as a ZIP archive. Forget cloning an entire repository just to get one folder. GitLode is a fast, client-side, and privacy-focused alternative to services like DownGit, packed with advanced features for a superior workflow.

### [➡️ Try GitLode Live!](https://ryno9341.github.io/gitlode)

---

## ✨ Key Features

- **Modern & Responsive UI**: A clean, intuitive interface built with Bootstrap 5 and the Spacelab theme.
- **Intelligent URL Parsing**: Automatically detects the owner, repository, branch, and sub-path from any valid GitHub URL.
- **Query Parameter Support**: Pre-fill the download URL for easy sharing and bookmarking (`?url=...`).
- **File Tree Manifest**: See a complete, hierarchical list of all files and their sizes _before_ the download begins.
- **Detailed Process Logging**: A live, auto-scrolling log window shows every step of the process, from parsing to completion.
- **GitHub Token Integration**: Overcome API rate limits by providing a Personal Access Token, which is securely saved in your browser's local storage for future use.
- **100% Client-Side**: All operations—fetching, processing, and zipping—happen directly in your browser. Your files and tokens are never sent to a server, ensuring complete privacy.

## 🚀 How to Use

1.  **Paste URL**: Copy a URL to a GitHub repository or a specific directory within it.
2.  **Paste it into the input field** on the GitLode homepage.
3.  **Click Download**: The file manifest will appear, and the download will begin automatically.
4.  **Save**: Your browser will prompt you to save the generated `.zip` file.

### Using Query Parameters

You can create a direct download link by appending a `url` query parameter to the GitLode URL.

**Example:**

```
https://ryno9341.github.io/gitlode/?url=https://github.com/vercel/next.js/tree/canary/examples/basic-css
```

### Using a GitHub Token (Recommended for Large Directories)

GitHub's API limits unauthenticated requests to 60 per hour. For large directories with many files, you may hit this limit. Using a Personal Access Token increases the limit to **5,000 requests per hour**.

1.  **Generate a Token**: Use this [pre-filled link to generate a new token](https://github.com/settings/tokens/new?description=GitLode&scopes=repo). The `repo` scope is required for accessing private repositories and is recommended for public ones.
2.  **Expand the Token Section**: On the GitLode page, click on "Use GitHub Token".
3.  **Paste Your Token**: Paste the generated token into the input field.
4.  **It's Saved!**: Your token is now saved securely in your browser's `localStorage` and will be used automatically for all future downloads.

## 🛠️ Local Development & Setup

GitLode is a static application and requires no complex build process. You can run it with any simple web server.

**Prerequisites:**

- A modern web browser.
- A local web server. If you don't have one, Python's built-in server is a great choice.

**Steps:**

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ryno9341/gitlode.git
    cd gitlode
    ```

2.  **Start a local server:**

    - Using Python 3:
      ```bash
      python -m http.server
      ```
    - Using Node.js (requires `serve` package):
      ```bash
      npx serve
      ```
    - Or use a tool like the [Live Server extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

3.  **Open in browser:**
    Navigate to `http://localhost:5500` (or the port specified by your server).

## 💻 Technology Stack

- **Frontend Framework**: AngularJS (v1.8)
- **UI & Styling**: Bootstrap 5, Bootswatch (Spacelab), Font Awesome
- **Core Logic**:
  - **JSZip**: For creating `.zip` archives in the browser.
  - **FileSaver.js**: For saving the generated file.
- **Hosting**: Static HTML, CSS, and JS. Perfect for deployment on services like GitHub Pages, Netlify, or Vercel.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
