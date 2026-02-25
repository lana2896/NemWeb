/**
 * LanguageManager Class
 * Handles fetching, caching, and applying translations.
 */
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'vi'; // Default to Vietnamese
        this.translations = {}; // Cache for loaded translations
        this.elements = document.querySelectorAll('[data-i18n]');
    }

    /**
     * Initialize the language manager.
     */
    async init() {
        await this.loadLanguage(this.currentLang);
        this.updateDOM();
        this.updateToggleButton();
    }

    /**
     * Load language data from JSON file.
     * @param {string} lang - Language code ('vi' or 'en')
     */
    async loadLanguage(lang) {
        if (this.translations[lang]) return; // Return if already cached

        try {
            // Robust path handling:
            // If we are in /Nem/ (root), path is assets/data/
            // If we are in /Nem/admin.html, path is also assets/data/ (since it's in root)
            // But if ensuring absolute path from project root is safest relative to domain

            // We'll use a relative path that works for the standard structure
            const path = 'assets/data/';

            const response = await fetch(`${path}${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang} language file: ${response.statusText}`);
            this.translations[lang] = await response.json();
            console.log(`Loaded ${lang} language data.`);
        } catch (error) {
            console.error('Error loading language:', error);
        }
    }

    /**
     * Switch language and update the UI.
     * @param {string} lang - Language code to switch to
     */
    async switchLanguage(lang) {
        if (this.currentLang === lang) return;

        this.currentLang = lang;
        localStorage.setItem('lang', lang);

        await this.loadLanguage(lang);
        this.updateDOM();
        this.updateToggleButton();
    }

    /**
     * Toggle between VI and EN.
     */
    toggleLanguage() {
        const newLang = this.currentLang === 'vi' ? 'en' : 'vi';
        this.switchLanguage(newLang);
    }

    /**
     * Update the DOM with translated text.
     */
    updateDOM() {
        const data = this.translations[this.currentLang];
        if (!data) return;

        this.elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (data[key]) {
                // If element has HTML content
                if (['P', 'H1', 'H2', 'H3', 'SPAN', 'DIV'].includes(el.tagName)) {
                    el.innerHTML = data[key];
                } else if (['INPUT', 'TEXTAREA'].includes(el.tagName)) {
                    el.placeholder = data[key];
                } else if (el.tagName === 'OPTION') {
                    el.text = data[key];
                } else {
                    el.innerText = data[key];
                }
            }
        });
    }

    /**
     * Update the toggle button text.
     */
    updateToggleButton() {
        const btn = document.getElementById('lang-toggle');
        if (btn) {
            btn.innerText = this.currentLang === 'vi' ? 'EN' : 'VN';
        }
    }

    /**
     * Helper to get a specific string (for JS use)
     */
    get(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }
}

export default LanguageManager;
