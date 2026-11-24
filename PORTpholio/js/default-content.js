import { blogPosts } from './blog-data.js';

export const defaultContent = {
    site: {
        name: 'Nazmul Hossen Shuvo',
        description: 'Meet Nazmul Hossen Shuvo, a finance professional and digital marketing strategist sharing insights on SEO, business growth, and technology.',
        canonicalUrl: 'https://nazmul-hossen-shuvo.web.app/',
        copyright: '2026 Nazmul Hossen Shuvo. All rights reserved.'
    },
    navigation: {
        about: 'About',
        experience: 'Experience',
        blog: 'Blog',
        faq: 'FAQ',
        contact: 'Contact'
    },
    hero: {
        initials: 'NHS',
        name: 'Nazmul Hossen Shuvo',
        profession: 'Finance Professional & Digital Marketing Strategist',
        bio: 'Finance professional and digital marketing strategist, currently serving as CFO at Motionly Media.',
        profileImage: 'css/js/images/profile.jpg',
        whatsappUrl: 'https://wa.me/8801320792389',
        connectLabel: 'Connect with me',
        skills: ['Finance', 'Digital Marketing']
    },
    about: {
        title: 'About Me',
        text: 'I am a Finance Professional with 9+ years of experience, a Digital Marketing Strategist, and the CFO of Motionly Media.\n\nI help businesses grow through strategic finance, digital marketing, video marketing, and operational excellence.\n\nMy interests include AI automation, business strategy, entrepreneurship, finance, and emerging technologies.\n\nThrough my personal brand, I share practical insights on finance, marketing, technology, and business growth while documenting my journey of building businesses and creating impact.',
        details: [
            'Marketing & Finance Expert',
            'Chattogram, Bangladesh',
            'Available for Opportunities'
        ],
        links: [
            { label: 'about.me', url: 'https://about.me/nazmulhossenshuvo' },
            { label: 'Medium', url: 'https://medium.com/@nhtshuvo' }
        ]
    },
    experience: {
        title: 'Experience',
        items: [
            {
                title: 'Chief Financial Officer (CFO)',
                company: 'Motionly Media',
                duration: 'January 2026 – Present',
                description: '• Lead financial planning and business strategy initiatives.\n• Develop pricing structures and revenue strategies.\n• Participate in client acquisition and relationship management.\n• Support operational decision-making and growth planning.\n• Successfully converted multiple client meetings into paying customers through consultative selling.'
            },
            {
                title: 'Finance Director & Co-Founder',
                company: 'EquiSaaSBD',
                duration: 'February 2026 – May 2026',
                description: '• Responsible for pricing strategy and financial planning.\n• Contribute to business model development.\n• Support product commercialization planning for EquiPulse MVP.'
            },
            {
                title: 'SEO Intern',
                company: 'Shikkha IT Limited',
                duration: 'April 2026 – May 2026',
                description: '• Conduct keyword research and on-page SEO optimization.\n• Help improve search visibility for company assets.\n• Ranked multiple target keywords on the first page of Google search results.'
            },
            {
                title: 'Business Operations & Financial Management',
                company: 'Family Business',
                duration: 'November 2016 – Present',
                description: '• Manage daily operations during owner absence.\n• Handle cash flow monitoring and inventory management.\n• Maintain customer relationships and support repeat business growth.\n• Contributed to profitability improvement through cost-conscious operational decisions.'
            }
        ]
    },
    blog: {
        title: 'Blog',
        intro: 'Thoughts on finance, faith, business, and building a life with purpose.',
        posts: blogPosts
    },
    faq: {
        title: 'Frequently Asked Questions',
        items: [
            { question: 'What do you do?', answer: 'I work across finance, digital marketing, SEO, video marketing, and business operations.' },
            { question: 'Where are you based?', answer: 'I am based in Chattogram, Bangladesh.' },
            { question: 'How can I get in touch?', answer: 'You can reach me by email, WhatsApp, or LinkedIn using the contact details below.' },
            { question: 'Where can I read your articles?', answer: 'Visit the Blog for my latest writing.' }
        ]
    },
    contact: {
        title: 'Contact',
        email: 'nhtshuvo@gmail.com',
        emailHref: 'mailto:nhtshuvo@gmail.com',
        whatsappUrl: 'https://wa.me/8801320792389',
        whatsappLabel: 'Chat on WhatsApp',
        linkedinUrl: 'https://www.linkedin.com/in/nazmul-hossen-shuvo',
        linkedinLabel: 'nazmul-hossen-shuvo',
        location: 'Chattogram, Bangladesh',
        nameLabel: 'Your Name',
        emailLabel: 'Your Email',
        messageLabel: 'Your Message',
        submitLabel: 'Send Message',
        privacyNote: 'Your message is prepared in your email app; this website does not receive or store it.'
    },
    footer: {
        linkedinUrl: 'https://www.linkedin.com/in/nazmul-hossen-shuvo',
        emailUrl: 'mailto:nhtshuvo@gmail.com',
        blog: 'Blog',
        faq: 'FAQ',
        privacy: 'Privacy Policy'
    }
};

function matchesBlogContent(value) {
    return Array.isArray(value) && value.every(part => {
        if (!part || typeof part !== 'object') {
            return false;
        }
        if (part.type === 'p' || part.type === 'heading' || part.type === 'quote') {
            return typeof part.text === 'string';
        }
        if (part.type === 'list') {
            return Array.isArray(part.items) && part.items.every(item => typeof item === 'string'
                || (item && typeof item.title === 'string' && typeof item.text === 'string'));
        }
        if (part.type === 'table') {
            if (!Array.isArray(part.columns) || part.columns.length === 0 || !Array.isArray(part.rows)) {
                return false;
            }
            const keys = part.columns.map(column => column && column.key);
            return part.columns.every(column => column && typeof column.key === 'string'
                    && typeof column.label === 'string')
                && new Set(keys).size === keys.length
                && part.rows.every(row => row && typeof row === 'object'
                    && keys.every(key => typeof row[key] === 'string')
                    && Object.keys(row).length === keys.length);
        }
        return false;
    });
}

export function matchesContentShape(template, value) {
    if (typeof template === 'string') {
        return typeof value === 'string';
    }
    if (Array.isArray(template)) {
        if (template.some(item => item && typeof item === 'object' && typeof item.slug === 'string')) {
            return Array.isArray(value) && value.every(post => {
                if (!post || typeof post !== 'object' || Array.isArray(post)) {
                    return false;
                }
                const sample = template.find(item => item.slug === post.slug) || template[0];
                const postTemplate = { ...sample };
                if (typeof post.author !== 'string') {
                    delete postTemplate.author;
                }
                return matchesContentShape(postTemplate, post);
            });
        }
        if (template.some(item => item && typeof item === 'object' && typeof item.type === 'string')) {
            return matchesBlogContent(value);
        }
        return Array.isArray(value)
            && (template.length === 0 || value.every(item => matchesContentShape(template[0], item)));
    }
    if (template && typeof template === 'object') {
        const matches = Boolean(value)
            && typeof value === 'object'
            && !Array.isArray(value)
            && Object.keys(template).every(key => Object.prototype.hasOwnProperty.call(value, key)
                && matchesContentShape(template[key], value[key]));
        if (!matches) {
            return false;
        }
        if (template === defaultContent) {
            const slugs = new Set();
            return value.blog.posts.every(post => {
                if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)
                    || slugs.has(post.slug)
                    || !post.thumbnail.trim()
                    || !isSafeLink(post.thumbnail)) {
                    return false;
                }
                slugs.add(post.slug);
                return true;
            });
        }
        return true;
    }
    return typeof value === typeof template;
}

export function normalizeContent(content) {
    if (!content || typeof content !== 'object' || !content.blog || !Array.isArray(content.blog.posts)) {
        return content;
    }

    const normalized = JSON.parse(JSON.stringify(content));
    normalized.blog.posts.forEach(post => {
        if (post && typeof post === 'object' && typeof post.thumbnail !== 'string') {
            const originalPost = blogPosts.find(item => item.slug === post.slug);
            post.thumbnail = originalPost ? originalPost.thumbnail : 'css/js/images/share-preview.jpg';
        }
    });
    return normalized;
}

export function isSafeLink(value) {
    return typeof value === 'string'
        && (/^(https?:\/\/|mailto:|tel:|#)/i.test(value) || (!/^[a-z][a-z\d+.-]*:/i.test(value) && !value.startsWith('//')));
}
