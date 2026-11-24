import { defaultContent, isSafeLink, matchesContentShape, normalizeContent } from './default-content.js';
import { isFirebaseConfigured } from './firebase-config.js';

function getValue(source, path) {
    return path.split('.').reduce((value, key) => value && value[key], source);
}

function setContent(content) {
    document.querySelectorAll('[data-content]').forEach(element => {
        const value = getValue(content, element.dataset.content);
        if (typeof value !== 'string') {
            return;
        }

        const attribute = element.dataset.contentAttribute;
        if (attribute === 'href' || attribute === 'src') {
            if (!isSafeLink(value)) {
                console.error(`Skipped unsafe ${attribute} value for ${element.dataset.content}.`);
                return;
            }
            element.setAttribute(attribute, value);
        } else {
            element.textContent = value;
        }
    });

    document.querySelectorAll('[data-content-href]').forEach(element => {
        const href = getValue(content, element.dataset.contentHref);
        if (typeof href === 'string' && isSafeLink(href)) {
            element.href = href;
        } else {
            console.error(`Skipped unsafe link value for ${element.dataset.contentHref}.`);
        }
    });

    const isBlogPage = Boolean(document.getElementById('blog-posts'));
    const title = isBlogPage
        ? `${content.blog.title} | ${content.site.name}`
        : `${content.site.name} | ${content.hero.profession}`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', content.site.description);
    const canonicalUrl = isBlogPage
        ? new URL('blog.html', content.site.canonicalUrl).href
        : content.site.canonicalUrl;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', content.site.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
    document.querySelector('meta[property="og:site_name"]')?.setAttribute('content', content.site.name);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', content.site.description);
    const profileImage = document.getElementById('profile-img');
    if (profileImage) {
        profileImage.alt = content.hero.name;
    }
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.dataset.contactEmail = content.contact.email;
    }
}

function addText(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    parent.appendChild(element);
    return element;
}

function renderList(container, entries, renderEntry) {
    if (!container) {
        return;
    }
    container.replaceChildren();
    entries.forEach((entry, index) => renderEntry(container, entry, index));
}

function renderContentArrays(content) {
    const detailIcons = ['fa-briefcase', 'fa-map-marker-alt', 'fa-graduation-cap'];
    renderList(document.querySelector('.hero-skills'), content.hero.skills, (parent, skill) => {
        addText(parent, 'span', 'skill-tag', skill);
    });

    renderList(document.querySelector('.about-details'), content.about.details, (parent, detail, index) => {
        const item = document.createElement('div');
        item.className = 'detail-item';
        const icon = document.createElement('i');
        icon.className = `fas ${detailIcons[index] || 'fa-circle-info'}`;
        icon.setAttribute('aria-hidden', 'true');
        item.appendChild(icon);
        addText(item, 'span', '', detail);
        parent.appendChild(item);
    });

    renderList(document.querySelector('.about-links'), content.about.links, (parent, link) => {
        if (!isSafeLink(link.url)) {
            return;
        }
        const anchor = addText(parent, 'a', 'contact-btn', link.label);
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noreferrer noopener';
    });

    renderList(document.querySelector('.experience-list'), content.experience.items, (parent, experience) => {
        const item = document.createElement('div');
        item.className = 'experience-item';
        addText(item, 'h3', 'experience-title', experience.title);
        addText(item, 'p', 'experience-company', experience.company);
        addText(item, 'p', 'experience-duration', experience.duration);
        const description = addText(item, 'p', 'experience-description', experience.description);
        description.style.whiteSpace = 'pre-line';
        parent.appendChild(item);
    });

    renderList(document.querySelector('.faq-list'), content.faq.items, (parent, faq) => {
        const item = document.createElement('details');
        item.className = 'faq-item';
        addText(item, 'summary', '', faq.question);
        addText(item, 'p', '', faq.answer);
        parent.appendChild(item);
    });

    renderBlogPreview(content);
    renderBlogPosts(content);
}

function sortedPosts(content) {
    return [...content.blog.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderBlogPreview(content) {
    const container = document.getElementById('blog-preview');
    if (!container) {
        return;
    }

    container.replaceChildren();
    sortedPosts(content).forEach(post => {
        const card = document.createElement('a');
        card.className = 'blog-preview-card';
        card.href = `blog.html#${encodeURIComponent(post.slug)}`;
        card.setAttribute('aria-label', `Read ${post.title}`);

        const imageUrl = isSafeLink(post.thumbnail)
            ? post.thumbnail
            : 'css/js/images/share-preview.jpg';
        if (imageUrl !== post.thumbnail) {
            console.error(`Skipped unsafe thumbnail URL for blog post "${post.slug}".`);
        }
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = '';
        image.loading = 'lazy';
        card.appendChild(image);
        addText(card, 'h3', 'blog-preview-title', post.title);
        container.appendChild(card);
    });
}

function renderBlogPosts(content) {
    const container = document.getElementById('blog-posts');
    if (!container) {
        return;
    }
    const posts = sortedPosts(content);
    container.replaceChildren();
    if (!posts.length) {
        addText(container, 'p', 'blog-post-excerpt', 'Blog content is not available right now.');
        return;
    }

    posts.forEach(post => {
        const article = document.createElement('article');
        article.className = 'blog-post';
        article.id = post.slug;
        article.lang = /[\u0980-\u09FF]/.test(post.title) ? 'bn' : 'en';
        const cover = document.createElement('img');
        cover.className = 'blog-post-cover';
        cover.src = isSafeLink(post.thumbnail) ? post.thumbnail : 'css/js/images/share-preview.jpg';
        cover.alt = post.title;
        cover.loading = 'lazy';
        article.appendChild(cover);
        addText(article, 'p', 'blog-meta', `${post.category} • ${post.date} • ${post.readTime}`);
        addText(article, 'h2', 'blog-post-title', post.title);
        if (post.author) {
            addText(article, 'p', 'blog-author', post.author);
        }
        addText(article, 'p', 'blog-post-excerpt', post.excerpt);
        post.content.forEach(part => {
            if (part.type === 'list') {
                const list = document.createElement('ul');
                list.className = 'blog-post-list';
                part.items.forEach(item => {
                    const listItem = document.createElement('li');
                    if (typeof item === 'string') {
                        listItem.textContent = item;
                    } else {
                        addText(listItem, 'strong', '', `${item.title}: `);
                        addText(listItem, 'span', '', item.text);
                    }
                    list.appendChild(listItem);
                });
                article.appendChild(list);
                return;
            }
            if (part.type === 'table') {
                const wrapper = document.createElement('div');
                wrapper.className = 'blog-table-wrap';
                const table = document.createElement('table');
                table.className = 'blog-comparison-table';
                const head = document.createElement('thead');
                const headerRow = document.createElement('tr');
                part.columns.forEach(column => {
                    addText(headerRow, 'th', '', column.label).scope = 'col';
                });
                head.appendChild(headerRow);
                table.appendChild(head);
                const body = document.createElement('tbody');
                part.rows.forEach(row => {
                    const tableRow = document.createElement('tr');
                    part.columns.forEach(column => addText(tableRow, 'td', '', row[column.key]));
                    body.appendChild(tableRow);
                });
                table.appendChild(body);
                wrapper.appendChild(table);
                article.appendChild(wrapper);
                return;
            }
            const tag = part.type === 'heading' ? 'h3' : part.type === 'quote' ? 'blockquote' : 'p';
            const className = part.type === 'heading'
                ? 'blog-post-heading'
                : part.type === 'quote' ? 'blog-post-quote' : '';
            addText(article, tag, className, part.text);
        });
        container.appendChild(article);
    });

    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
        window.requestAnimationFrame(() => target.scrollIntoView());
    }
}

async function loadContent() {
    if (!isFirebaseConfigured()) {
        setContent(defaultContent);
        renderContentArrays(defaultContent);
        return;
    }

    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const { createFirebaseClients } = await import('./firebase-client.js');
        const { db } = createFirebaseClients();
        const snapshot = await getDoc(doc(db, 'siteContent', 'current'));
        const content = normalizeContent(snapshot.exists() ? snapshot.data().content : defaultContent);
        if (!matchesContentShape(defaultContent, content)) {
            throw new Error('Published website content has an invalid format. Showing the built-in content instead.');
        }
        setContent(content);
        renderContentArrays(content);
    } catch (error) {
        console.error('Unable to load published website content; showing the built-in content instead.', error);
        setContent(defaultContent);
        renderContentArrays(defaultContent);
    }
}

loadContent();
