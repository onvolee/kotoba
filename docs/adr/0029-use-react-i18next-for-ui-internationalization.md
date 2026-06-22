# Use react-i18next for UI internationalization

Kotoba will include UI internationalization in the first version using `react-i18next`. The first supported UI languages are English and Simplified Chinese, with the default language following the browser language and falling back to English when the browser language is unsupported. The user can override the UI language in settings, and that preference is stored in extension local storage; translation content produced by the model remains user data and is not managed by the UI i18n layer.
