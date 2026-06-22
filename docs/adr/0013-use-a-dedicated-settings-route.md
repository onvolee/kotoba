# Use a dedicated settings route

Kotoba will provide model and API configuration through a dedicated settings route inside the extension-owned workspace application, not through a drawer, dialog, popup, or separate browser options page. The workspace Settings control should navigate to this route, where layout and detailed settings interactions can be designed separately. This keeps configuration as a first-class workspace page while avoiding transient modal UI for required provider setup.
