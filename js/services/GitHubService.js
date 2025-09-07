(function () {
  "use strict";

  angular.module("gitLodeApp").factory("GitHubService", GitHubService);

  GitHubService.$inject = ["$http", "$q"];

  function GitHubService($http, $q) {
    var service = {
      parseUrl: parseUrl,
      resolveBranchAndPath: resolveBranchAndPath,
      getDirectoryFiles: getDirectoryFiles,
      fetchBlob: fetchBlob,
    };
    return service;

    function getApiHeaders(token) {
      const headers = { Accept: "application/vnd.github.v3+json" };
      if (token) {
        headers["Authorization"] = "token " + token;
      }
      return headers;
    }

    function parseUrl(url) {
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname !== "github.com") return null;

        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
        if (pathParts.length < 2) return null;

        const [owner, repo] = pathParts;
        const typeIndex = pathParts.indexOf("tree");
        if (typeIndex === -1 || typeIndex + 1 >= pathParts.length) {
          return { owner, repo, refAndPath: null };
        }

        const refAndPath = pathParts.slice(typeIndex + 1).join("/");
        return { owner, repo, refAndPath };
      } catch (e) {
        return null;
      }
    }

    function resolveBranchAndPath(owner, repo, refAndPath, token) {
      if (!refAndPath) {
        return $q.reject(new Error("No branch or path specified in URL."));
      }

      const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const parts = refAndPath.split("/");

      function check(partsToCheck) {
        if (partsToCheck.length === 0) {
          return $q.reject(
            new Error("Could not resolve a valid branch from the URL."),
          );
        }

        const branchCandidate = partsToCheck.join("/");
        const branchApiUrl = `${apiBaseUrl}/branches/${encodeURIComponent(branchCandidate)}`;

        return $http
          .get(branchApiUrl, { headers: getApiHeaders(token) })
          .then(function () {
            const path = parts.slice(partsToCheck.length).join("/");
            return { branch: branchCandidate, path: path };
          })
          .catch(function (error) {
            if (error.status === 404) {
              return check(partsToCheck.slice(0, -1));
            }
            return $q.reject(error);
          });
      }

      return check(parts);
    }

    function getDirectoryFiles(apiUrl, token) {
      return $http
        .get(apiUrl, { headers: getApiHeaders(token) })
        .then(function (response) {
          const contents = response.data;
          const promises = contents.map(function (item) {
            if (item.type === "dir") {
              return getDirectoryFiles(item.url, token);
            } else if (item.type === "file") {
              return $q.when([
                {
                  path: item.path,
                  sha: item.sha,
                  size: item.size,
                },
              ]);
            }
            return $q.when([]);
          });
          return $q
            .all(promises)
            .then((results) => [].concat.apply([], results));
        });
    }

    function fetchBlob(url, token) {
      return $http
        .get(url, {
          headers: getApiHeaders(token),
          responseType: "json",
        })
        .then((response) => atob(response.data.content.replace(/\s/g, "")));
    }
  }
})();
