# Do not set application file size limits in the first version

Kotoba will not add first-version soft warnings or hard file-size limits for `.md` and `.txt` inputs. The product still translates the whole input in one request and does not implement chunking, so practical limits come from the configured provider, model context window, network behavior, and user cost tolerance. If large-input failures become common, token estimation, chunking, or explicit limits can be designed from real usage data.
