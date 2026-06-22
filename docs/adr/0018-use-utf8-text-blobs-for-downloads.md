# Use UTF-8 text blobs for downloads

Kotoba will download translated output as UTF-8 text blobs. Markdown downloads use `text/markdown;charset=utf-8`, plain text downloads use `text/plain;charset=utf-8`, and pasted input without a source filename uses `translation.zh.md`, `translation.en.md`, `translation.zh.txt`, or `translation.en.txt` depending on input type and translation direction. This keeps downloaded English and Chinese text portable and gives paste-based translations stable filenames.
