# Mark output stale after input or option changes

Kotoba will keep existing translation output when the source text, input type, translation direction, or style preset changes after a completed, failed, or stopped session, but the output is marked stale so users know it no longer matches the current input or options. Copy and download remain available for stale output, and a new Translate action starts a new session that can replace it. During streaming, key translation options should be locked and users should stop the session before changing them.
