(function () {
  "use strict";

  angular.module("gitLodeApp").controller("MainController", MainController);

  MainController.$inject = [
    "$scope",
    "$q",
    "$window",
    "GitHubService",
    "JSZip",
    "saveAs",
  ];

  function MainController($scope, $q, $window, GitHubService, JSZip, saveAs) {
    var ctrl = this;
    var TOKEN_STORAGE_KEY = "gitlode_github_token";

    ctrl.repoUrl = "";
    ctrl.githubToken = "";
    ctrl.isLoading = false;
    ctrl.statusMessage = "";
    ctrl.errorMessage = "";
    ctrl.progress = 0;
    ctrl.totalFiles = 0;
    ctrl.logMessages = [];
    ctrl.displayFiles = [];
    ctrl.startDownload = startDownload;

    function init() {
      const urlParams = new URLSearchParams($window.location.search);
      const repoUrlFromQuery = urlParams.get("url");

      if (repoUrlFromQuery) {
        ctrl.repoUrl = repoUrlFromQuery;
      }

      ctrl.githubToken = $window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
    }

    $scope.$watch("ctrl.githubToken", function (newValue) {
      $window.localStorage.setItem(TOKEN_STORAGE_KEY, newValue);
    });

    function addLogMessage(text, type) {
      ctrl.logMessages.push({ text: text, type: type || "info" });
    }

    function formatBytes(bytes, decimals = 2) {
      if (!bytes || bytes === 0) return "0 Bytes";
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    function buildFileTree(fileList, basePath) {
      const root = { children: {} };
      const relativePathOffset = basePath ? basePath.length + 1 : 0;

      fileList.forEach((file) => {
        let currentLevel = root;
        const relativePath = file.path.substring(relativePathOffset);
        const parts = relativePath.split("/");

        parts.forEach((part, index) => {
          if (!currentLevel.children[part]) {
            const isFile = index === parts.length - 1;
            currentLevel.children[part] = {
              name: part,
              type: isFile ? "file" : "folder",
              children: isFile ? null : {},
              size: isFile ? file.size : 0,
            };
          }
          currentLevel = currentLevel.children[part];
        });
      });
      return root;
    }

    function flattenTree(node, depth, result) {
      const children = Object.values(node.children);
      children.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      children.forEach((child) => {
        result.push({
          name: child.name,
          type: child.type,
          depth: depth,
          formattedSize: formatBytes(child.size),
        });
        if (child.type === "folder") {
          flattenTree(child, depth + 1, result);
        }
      });
    }

    function resetState() {
      ctrl.isLoading = true;
      ctrl.statusMessage = "";
      ctrl.errorMessage = "";
      ctrl.progress = 0;
      ctrl.totalFiles = 0;
      ctrl.logMessages = [];
      ctrl.displayFiles = [];
    }

    function startDownload() {
      if (!JSZip) {
        ctrl.errorMessage = "Zipping library is not available.";
        return;
      }
      resetState();
      addLogMessage("Download process started...", "info");

      const preliminaryInfo = GitHubService.parseUrl(ctrl.repoUrl);
      if (!preliminaryInfo || !preliminaryInfo.refAndPath) {
        let msg =
          'Invalid or incomplete GitHub URL. URL must contain "/tree/".';
        addLogMessage(msg, "error");
        ctrl.errorMessage = msg;
        ctrl.isLoading = false;
        return;
      }

      addLogMessage(
        `Parsed URL for owner "${preliminaryInfo.owner}" and repo "${preliminaryInfo.repo}".`,
        "info",
      );
      addLogMessage(
        `Attempting to resolve branch and path from: "${preliminaryInfo.refAndPath}"...`,
        "info",
      );

      GitHubService.resolveBranchAndPath(
        preliminaryInfo.owner,
        preliminaryInfo.repo,
        preliminaryInfo.refAndPath,
        ctrl.githubToken,
      )
        .then(function (repoInfo) {
          addLogMessage(`Resolved branch: "${repoInfo.branch}"`, "success");
          addLogMessage(
            `Resolved path: "${repoInfo.path || "(root)"}"`,
            "success",
          );

          const { owner, repo } = preliminaryInfo;
          const { branch, path } = repoInfo;
          const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`;
          const contentsUrl = `${apiBaseUrl}/contents/${path}?ref=${branch}`;

          addLogMessage("Fetching file list from repository...", "info");
          return GitHubService.getDirectoryFiles(
            contentsUrl,
            ctrl.githubToken,
          ).then(function (fileList) {
            if (!fileList || fileList.length === 0)
              throw new Error("Directory is empty or not found.");

            addLogMessage(
              `Found ${fileList.length} files. Building file tree...`,
              "success",
            );
            ctrl.totalFiles = fileList.length;

            const tree = buildFileTree(fileList, path);
            const flattenedList = [];
            flattenTree(tree, 0, flattenedList);
            ctrl.displayFiles = flattenedList;

            return downloadAndZipFiles(fileList, { owner, repo, path });
          });
        })
        .then(function (zip) {
          const repoInfo = GitHubService.parseUrl(ctrl.repoUrl);
          addLogMessage("Generating ZIP file...", "info");
          ctrl.statusMessage = "Generating ZIP file...";
          ctrl.progress = 100;
          const zipFileName = `${repoInfo.repo}-${preliminaryInfo.refAndPath.replace(/\//g, "_")}.zip`;
          return zip.generateAsync({ type: "blob" }).then(function (content) {
            saveAs(content, zipFileName);
          });
        })
        .then(function () {
          addLogMessage("Download complete!", "success");
          ctrl.statusMessage =
            "Your ZIP file should be in your downloads folder.";
          ctrl.isLoading = false;
        })
        .catch(function (error) {
          let message = "An unknown error occurred.";
          if (error.status === 404)
            message =
              "Could not resolve branch from URL or directory not found.";
          else if (error.status === 403)
            message = "API rate limit exceeded. Please use a GitHub token.";
          else if (error.message) message = error.message;

          addLogMessage(message, "error");
          ctrl.errorMessage = message;
          ctrl.isLoading = false;
          ctrl.statusMessage = "";
        });
    }

    function downloadAndZipFiles(fileList, repoInfo) {
      const zip = new JSZip();
      let downloadedCount = 0;
      const { owner, repo, path } = repoInfo;
      const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const relativePathOffset = path ? path.length + 1 : 0;

      const downloadPromises = fileList.map(function (file) {
        const blobUrl = `${apiBaseUrl}/git/blobs/${file.sha}`;
        return GitHubService.fetchBlob(blobUrl, ctrl.githubToken).then(
          function (content) {
            const relativePath = file.path.substring(relativePathOffset);
            zip.file(relativePath, content, { binary: true });
            downloadedCount++;
            ctrl.progress = (downloadedCount / ctrl.totalFiles) * 100;
            ctrl.statusMessage = `Downloading file ${downloadedCount}/${ctrl.totalFiles}...`;
          },
        );
      });

      return $q.all(downloadPromises).then(function () {
        return zip;
      });
    }

    init();
  }
})();
