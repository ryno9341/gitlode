(function () {
  'use strict';

  angular.module('gitLodeApp').factory('GitHubService', GitHubService);

  GitHubService.$inject = ['$http', '$q'];

  function GitHubService($http, $q) {
    var service = {
      parseUrl: parseUrl,
      getDirectoryFiles: getDirectoryFiles,
      fetchBlob: fetchBlob,
    };
    return service;

    function parseUrl(url) {
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname !== 'github.com') return null;

        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) return null;

        const [owner, repo] = pathParts;
        let branch = 'main';
        let path = '';

        const treeIndex = pathParts.indexOf('tree');
        if (treeIndex !== -1 && treeIndex + 1 < pathParts.length) {
          branch = pathParts[treeIndex + 1];
          path = pathParts.slice(treeIndex + 2).join('/');
        } else if (pathParts.length > 2) {
          path = pathParts.slice(2).join('/');
        }

        return { owner, repo, branch, path };
      } catch (e) {
        return null;
      }
    }

    function getApiHeaders(token) {
      const headers = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) {
        headers['Authorization'] = 'token ' + token;
      }
      return headers;
    }

    function getDirectoryFiles(apiUrl, token) {
      return $http
        .get(apiUrl, { headers: getApiHeaders(token) })
        .then(function (response) {
          const contents = response.data;
          const promises = contents.map(function (item) {
            if (item.type === 'dir') {
              return getDirectoryFiles(item.url, token);
            } else if (item.type === 'file') {
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

          return $q.all(promises).then(function (results) {
            return [].concat.apply([], results);
          });
        });
    }

    function fetchBlob(url, token) {
      return $http
        .get(url, {
          headers: getApiHeaders(token),
          responseType: 'json',
        })
        .then(function (response) {
          return atob(response.data.content.replace(/\s/g, ''));
        });
    }
  }
})();
