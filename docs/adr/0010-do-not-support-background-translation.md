# Do not support background translation in the first version

Kotoba's first version will only stream translations while the extension-owned workspace page is alive. Closing or refreshing the workspace, stopping the request, or otherwise interrupting the page makes the current translation incomplete, and incomplete translations are not saved to history. We will not move streaming translation into a Manifest V3 background service worker because long-running streamed tasks would add lifecycle, retry, notification, and recovery concerns that do not fit the first-version single-request workflow.
