// Add the GA4 Measurement ID here to activate consent-gated analytics.
const GA4_MEASUREMENT_ID = '';
const ANALYTICS_CONSENT_KEY = 'portfolio-analytics-consent';
const CONTACT_DRAFT_KEY = 'portfolio-contact-mailto-draft';

function isValidMeasurementId(value) {
    return /^G-[A-Z0-9]+$/i.test(value);
}

function loadGoogleAnalytics() {
    if (window.googleAnalyticsLoaded || !isValidMeasurementId(GA4_MEASUREMENT_ID)) {
        return;
    }

    window.googleAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        window.dataLayer.push(arguments);
    };

    window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, { anonymize_ip: true });

    const analyticsScript = document.createElement('script');
    analyticsScript.async = true;
    analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    analyticsScript.addEventListener('error', () => {
        console.error('Google Analytics could not be loaded.');
        window.googleAnalyticsLoaded = false;
    });
    document.head.appendChild(analyticsScript);
}

function setAnalyticsConsent(granted) {
    try {
        localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? 'granted' : 'denied');
    } catch (error) {
        console.error('Unable to save the analytics preference in this browser.', error);
    }
    if (window.gtag) {
        window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    }
    if (granted) {
        loadGoogleAnalytics();
    }
}

function showAnalyticsConsent() {
    if (!isValidMeasurementId(GA4_MEASUREMENT_ID)) {
        const status = document.getElementById('analytics-status');
        if (status) {
            status.textContent = 'Google Analytics is not active because its Measurement ID has not been configured.';
        }
        return;
    }

    let banner = document.getElementById('analytics-consent');
    if (banner) {
        banner.remove();
    }

    banner = document.createElement('section');
    banner.id = 'analytics-consent';
    banner.className = 'analytics-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Analytics consent');

    const message = document.createElement('p');
    message.textContent = 'Allow Google Analytics to collect website usage information? You can change this choice later in the Privacy Policy.';
    banner.appendChild(message);

    const policyLink = document.createElement('a');
    policyLink.href = 'privacy.html';
    policyLink.textContent = 'Read the Privacy Policy';
    banner.appendChild(policyLink);

    const actions = document.createElement('div');
    actions.className = 'analytics-consent-actions';

    const accept = document.createElement('button');
    accept.className = 'submit-btn';
    accept.type = 'button';
    accept.textContent = 'Allow analytics';
    accept.addEventListener('click', () => {
        setAnalyticsConsent(true);
        banner.remove();
    });

    const decline = document.createElement('button');
    decline.className = 'text-button';
    decline.type = 'button';
    decline.textContent = 'Decline';
    decline.addEventListener('click', () => {
        setAnalyticsConsent(false);
        banner.remove();
    });

    actions.append(accept, decline);
    banner.appendChild(actions);
    document.body.appendChild(banner);
}

function initializeAnalytics() {
    if (!isValidMeasurementId(GA4_MEASUREMENT_ID)) {
        return;
    }

    let consent;
    try {
        consent = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    } catch (error) {
        console.error('Unable to read the analytics preference in this browser.', error);
        showAnalyticsConsent();
        return;
    }
    if (consent === 'granted') {
        loadGoogleAnalytics();
    } else if (consent !== 'denied') {
        showAnalyticsConsent();
    }
}

function initializeContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) {
        return;
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) {
            return;
        }

        const clean = value => value
            .replace(/\r\n?/g, '\n')
            .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
            .trim();
        const name = clean(form.querySelector('#contact-name').value);
        const email = clean(form.querySelector('#contact-email').value);
        const message = clean(form.querySelector('#contact-message').value);
        const subject = 'Portfolio contact request';
        const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
        const recipient = form.dataset.contactEmail || 'nhtshuvo@gmail.com';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
            console.error('The configured contact email address is invalid.');
            window.alert('The website contact address is invalid. Please try again later.');
            return;
        }
        const draft = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        try {
            sessionStorage.setItem(CONTACT_DRAFT_KEY, draft);
        } catch (error) {
            console.error('Unable to prepare the contact email in this browser.', error);
            window.alert(`Your browser blocked the temporary email draft. Please email ${recipient} directly.`);
            return;
        }

        window.location.assign('thank-you.html');
    });
}

function initializeEmailHandoff() {
    const sendLink = document.getElementById('send-email-draft');
    if (!sendLink) {
        return;
    }

    const message = document.getElementById('email-handoff-message');
    let draft;
    try {
        draft = sessionStorage.getItem(CONTACT_DRAFT_KEY);
    } catch (error) {
        console.error('Unable to access the prepared contact email in this browser.', error);
        message.textContent = 'This browser could not retrieve the prepared email. Please email nhtshuvo@gmail.com directly.';
        return;
    }
    if (!draft || !/^mailto:[^\s?@]+@[^\s?@]+\.[^\s?@]+\?/i.test(draft)) {
        message.textContent = 'There is no prepared message in this browser session. Return to the contact form and prepare a new message.';
        return;
    }

    sendLink.href = draft;
    sendLink.hidden = false;
    sendLink.addEventListener('click', () => {
        sessionStorage.removeItem(CONTACT_DRAFT_KEY);
    }, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
    initializeContactForm();
    initializeEmailHandoff();

    document.querySelectorAll('[data-analytics-settings]').forEach(button => {
        button.addEventListener('click', showAnalyticsConsent);
    });
});
