# Confirm single history deletes without undo

Kotoba will require confirmation before deleting an individual history record in the first version. Confirmed deletes remove the record from IndexedDB, but if that record is currently restored in the workspace, the workspace content remains unchanged. Undo, batch delete, and delete-all actions are out of scope to keep history management small and avoid accidental destructive operations.
