function collectCriticalCSS() {
    let criticalRules = new Set();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Helper function to add CSS rules
    const addCSSRule = (rule) => {
        if (rule instanceof CSSStyleRule || rule instanceof CSSFontFaceRule) {
            criticalRules.add(rule.cssText);
        }
    };

    // Helper function to process media rules
    const processMediaRule = (mediaRule) => {
        if (window.matchMedia(mediaRule.conditionText).matches) {
            Array.from(mediaRule.cssRules).forEach((rule) => {
                if (rule instanceof CSSStyleRule) {
                    const matchedElements = document.querySelectorAll(rule.selectorText);
                    matchedElements.forEach((element) => {
                        const rect = element.getBoundingClientRect();
                        if (
                            rect.top < viewportHeight &&
                            rect.left < viewportWidth &&
                            rect.bottom > 0 &&
                            rect.right > 0
                        ) {
                            criticalRules.add(`@media ${mediaRule.conditionText} { ${rule.cssText} }`);
                        }
                    });
                } else if (rule instanceof CSSFontFaceRule) {
                    // Include @font-face inside media queries
                    criticalRules.add(`@media ${mediaRule.conditionText} { ${rule.cssText} }`);
                }
            });
        }
    };

    // Collect styles from external stylesheets
    Array.from(document.styleSheets).forEach((stylesheet) => {
        try {
            const rules = stylesheet.cssRules || [];
            Array.from(rules).forEach((rule) => {
                if (rule instanceof CSSStyleRule) {
                    const matchedElements = document.querySelectorAll(rule.selectorText);
                    matchedElements.forEach((element) => {
                        const rect = element.getBoundingClientRect();
                        if (
                            rect.top < viewportHeight &&
                            rect.left < viewportWidth &&
                            rect.bottom > 0 &&
                            rect.right > 0
                        ) {
                            addCSSRule(rule);
                        }
                    });
                } else if (rule instanceof CSSFontFaceRule) {
                    addCSSRule(rule);
                } else if (rule instanceof CSSMediaRule) {
                    processMediaRule(rule);
                }
            });
        } catch (e) {
            console.warn(`Unable to access stylesheet: ${stylesheet.href}`, e);
        }
    });

    // Collect inline <style> tags
    Array.from(document.querySelectorAll("style")).forEach((styleTag) => {
        try {
            const rules = styleTag.sheet.cssRules || [];
            Array.from(rules).forEach((rule) => {
                if (rule instanceof CSSStyleRule) {
                    const matchedElements = document.querySelectorAll(rule.selectorText);
                    matchedElements.forEach((element) => {
                        const rect = element.getBoundingClientRect();
                        if (
                            rect.top < viewportHeight &&
                            rect.left < viewportWidth &&
                            rect.bottom > 0 &&
                            rect.right > 0
                        ) {
                            addCSSRule(rule);
                        }
                    });
                } else if (rule instanceof CSSFontFaceRule) {
                    addCSSRule(rule);
                } else if (rule instanceof CSSMediaRule) {
                    processMediaRule(rule);
                }
            });
        } catch (e) {
            console.warn("Unable to parse inline style tag", e);
        }
    });

    // Collect inline styles from `style` attributes
    Array.from(document.body.getElementsByTagName("*")).forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (
            rect.top < viewportHeight &&
            rect.left < viewportWidth &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            element.hasAttribute("style")
        ) {
            criticalRules.add(element.getAttribute("style"));
        }
    });

    // Minify and remove comments from collected CSS
    const minifiedCSS = [...criticalRules]
        .map((rule) =>
            rule
                .replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, "") // Remove all comments
                .replace(/\s+/g, " ") // Remove extra spaces
                .trim() // Trim leading and trailing spaces
        )
        .join("");

    // Wrap the Critical CSS inside a <style> tag
    return `<style>${minifiedCSS}</style>`;
}

// Return the minified Critical CSS wrapped in a <style> tag using seoSpider.data
return seoSpider.data(collectCriticalCSS());
