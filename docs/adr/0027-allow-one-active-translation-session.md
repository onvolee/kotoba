# Allow one active translation session

Kotoba's workspace will allow only one active translation session at a time. While streaming, Translate is disabled and Stop is enabled; after idle, completed, failed, or stopped states, Translate can start a new session if input and settings are valid. This avoids queues, concurrent output streams, competing history writes, and multiple active abort controllers in the first version.
