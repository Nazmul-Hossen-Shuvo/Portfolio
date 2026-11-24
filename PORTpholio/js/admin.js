import { doc, getDoc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { adminEmail } from './firebase-config.js';
import { createFirebaseClients, isFirebaseConfigured } from './firebase-client.js';
import { defaultContent, isSafeLink, matchesContentShape, normalizeContent } from './default-content.js';

const statusElement = document.getElementById('admin-status');
const loginForm = document.getElementById('admin-login');
const editorPanel = document.getElementById('admin-editor');
const contentForm = document.getElementById('content-form');
const contentFields = document.getElementById('content-fields');
const saveButton = document.getElementById('save-content');
let clients;
let draft;

function showStatus(message, isError) {
    statusElement.textContent = message;
    statusElement.classList.toggle('is-error', Boolean(isError));
}

function cloneContent(value) {
    return JSON.parse(JSON.stringify(value));
}

function setValueAtPath(object, path, value) {
    const keys = path.split('.');
    const finalKey = keys.pop();
    const parent = keys.reduce((current, key) => current[key], object);
    parent[finalKey] = value;
}

function getValueAtPath(object, path) {
    return path.split('.').reduce((value, key) => value[key], object);
}

function createField(label, path, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-field';
    const inputLabel = document.createElement('label');
    inputLabel.textContent = label;

    const isLongText = value.length > 120 || /text|description|answer|excerpt|privacyNote/i.test(path);
    const input = document.createElement(isLongText ? 'textarea' : 'input');
    input.id = `field-${path.replace(/[^\w-]/g, '-')}`;
    inputLabel.htmlFor = input.id;
    input.dataset.contentPath = path;
    if (isLongText) {
        input.rows = 5;
    } else {
        input.type = 'text';
    }
    input.value = value;
    input.addEventListener('input', () => {
        setValueAtPath(draft, path, input.value);
        if (path === 'contact.email') {
            draft.contact.emailHref = `mailto:${input.value}`;
        }
    });
    wrapper.append(inputLabel, input);
    return wrapper;
}

function renderArray(parent, label, path, items, depth) {
    const array = document.createElement('section');
    array.className = 'admin-array';
    const heading = document.createElement('div');
    heading.className = 'admin-array-heading';
    const title = document.createElement('h3');
    title.textContent = `${label} (${items.length})`;
    const addButton = document.createElement('button');
    addButton.className = 'text-button';
    addButton.type = 'button';
    addButton.textContent = 'Add item';
    addButton.addEventListener('click', () => {
        const template = getValueAtPath(defaultContent, path);
        let newItem = template.length ? cloneContent(template[0]) : '';
        if (path === 'blog.posts') {
            const posts = getValueAtPath(draft, path);
            let suffix = posts.length + 1;
            let slug = `new-post-${suffix}`;
            while (posts.some(post => post.slug === slug)) {
                slug = `new-post-${++suffix}`;
            }
            newItem = {
                slug,
                thumbnail: 'css/js/images/share-preview.jpg',
                title: 'New blog post',
                category: 'Uncategorized',
                date: new Date().toISOString().slice(0, 10),
                readTime: '1 min read',
                excerpt: '',
                content: [{ type: 'p', text: '' }]
            };
        }
        getValueAtPath(draft, path).push(newItem);
        renderEditor(draft);
    });
    heading.append(title, addButton);
    array.appendChild(heading);

    items.forEach((item, index) => {
        const itemPath = `${path}.${index}`;
        if (item && typeof item === 'object' && !Array.isArray(item)) {
            const group = document.createElement('details');
            group.className = 'admin-array-item';
            const summary = document.createElement('summary');
            const preview = item.title || item.question || (item.type && item.text ? `${item.type}: ${item.text}` : '');
            summary.textContent = `${label} ${index + 1}${preview ? ` — ${preview.slice(0, 70)}` : ''}`;
            group.appendChild(summary);
            group.appendChild(createRemoveButton(path, index, label));
            renderObject(group, item, itemPath, depth + 1);
            array.appendChild(group);
            return;
        }

        const row = document.createElement('div');
        row.className = 'admin-array-row';
        row.appendChild(createField(`${label} ${index + 1}`, itemPath, item));
        row.appendChild(createRemoveButton(path, index, label));
        array.appendChild(row);
    });
    parent.appendChild(array);
}

function createRemoveButton(path, index, label) {
    const button = document.createElement('button');
    button.className = 'text-button admin-remove-button';
    button.type = 'button';
    button.textContent = 'Remove';
    button.setAttribute('aria-label', `Remove ${label} ${index + 1}`);
    button.addEventListener('click', () => {
        getValueAtPath(draft, path).splice(index, 1);
        renderEditor(draft);
    });
    return button;
}

function renderObject(parent, value, path, depth) {
    Object.entries(value).forEach(([key, childValue]) => {
        const childPath = path ? `${path}.${key}` : key;
        if (childPath === 'contact.emailHref') {
            return;
        }
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, first => first.toUpperCase());
        if (Array.isArray(childValue)) {
            renderArray(parent, label, childPath, childValue, depth);
        } else if (childValue && typeof childValue === 'object') {
            const group = document.createElement('details');
            group.className = 'admin-group';
            group.open = depth === 0;
            const summary = document.createElement('summary');
            summary.textContent = label;
            group.appendChild(summary);
            renderObject(group, childValue, childPath, depth + 1);
            parent.appendChild(group);
        } else {
            parent.appendChild(createField(label, childPath, childValue));
        }
    });
}

function renderEditor(content) {
    draft = cloneContent(content);
    contentFields.replaceChildren();
    renderObject(contentFields, draft, '', 0);
}

function validateLinks(value, path) {
    if (Array.isArray(value)) {
        value.forEach((item, index) => validateLinks(item, `${path}[${index}]`));
        return;
    }
    if (!value || typeof value !== 'object') {
        if (path === 'content.site.canonicalUrl') {
            try {
                if (new URL(value).protocol !== 'https:') {
                    throw new Error();
                }
            } catch (error) {
                throw new Error('site.canonicalUrl must be an absolute https URL.');
            }
        }
        if (typeof value === 'string' && (/(url|href)$/i.test(path) || /profileImage$/i.test(path)) && !isSafeLink(value)) {
            throw new Error(`${path} must be a safe https, mailto, tel, fragment, or relative URL.`);
        }
        if (path === 'content.contact.email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error('contact.email must be a valid email address.');
        }
        return;
    }
    Object.entries(value).forEach(([key, child]) => validateLinks(child, `${path}.${key}`));
}

function showAuthenticatedEditor(user) {
    if (user.email !== adminEmail) {
        showStatus(`This account is not allowed. Sign in with ${adminEmail}.`, true);
        signOut(clients.auth).catch(error => {
            console.error('Unable to sign out the unauthorized account.', error);
        });
        return;
    }
    if (!user.emailVerified) {
        showStatus('Verify the admin email address before editing site content.', true);
        return;
    }

    loginForm.hidden = true;
    editorPanel.hidden = false;
    showStatus(`Signed in as ${user.email}.`, false);
    loadPublishedContent();
}

async function loadPublishedContent() {
    saveButton.disabled = true;
    showStatus('Loading saved website content…', false);
    try {
        const snapshot = await getDoc(doc(clients.db, 'siteContent', 'current'));
        const content = normalizeContent(snapshot.exists() ? snapshot.data().content : defaultContent);
        if (!matchesContentShape(defaultContent, content)) {
            throw new Error('Published content has an invalid format. No data was loaded into the editor.');
        }
        renderEditor(content);
        saveButton.disabled = false;
        if (!snapshot.exists()) {
            showStatus('No saved changes yet. The editor is showing the original website content.', false);
        } else {
            showStatus('Saved website content loaded.', false);
        }
    } catch (error) {
        console.error('Unable to read website content from Firestore.', error);
        showStatus(`Could not load saved content: ${error.message}`, true);
    }
}

async function initializeAdmin() {
    if (!isFirebaseConfigured()) {
        loginForm.hidden = true;
        showStatus('Firebase is not configured. Follow FIREBASE_SETUP.md, then add the web app settings in js/firebase-config.js.', true);
        return;
    }

    try {
        clients = createFirebaseClients();
        onAuthStateChanged(clients.auth, user => {
            if (user) {
                showAuthenticatedEditor(user);
            } else {
                loginForm.hidden = false;
                editorPanel.hidden = true;
            }
        }, error => {
            console.error('Firebase Authentication could not be initialized.', error);
            showStatus(`Authentication error: ${error.message}`, true);
        });
    } catch (error) {
        showStatus(error.message, true);
    }
}

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(clients.auth, email, password);
        loginForm.reset();
    } catch (error) {
        console.error('Admin sign-in failed.', error);
        showStatus(`Sign-in failed: ${error.message}`, true);
    }
});

document.getElementById('admin-create-account').addEventListener('click', async () => {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
        showStatus(`Only the configured admin email (${adminEmail}) can create an account.`, true);
        return;
    }
    if (!password) {
        showStatus('Enter a password to create the admin account.', true);
        return;
    }

    try {
        const credential = await createUserWithEmailAndPassword(clients.auth, email, password);
        await sendEmailVerification(credential.user);
        await signOut(clients.auth);
        showStatus(`A verification link was sent to ${adminEmail}. Verify the address, then sign in.`, false);
    } catch (error) {
        console.error('Admin account creation failed.', error);
        showStatus(`Could not create the admin account: ${error.message}`, true);
    }
});

document.getElementById('admin-sign-out').addEventListener('click', async () => {
    try {
        await signOut(clients.auth);
        showStatus('You have signed out.', false);
    } catch (error) {
        console.error('Admin sign-out failed.', error);
        showStatus(`Could not sign out: ${error.message}`, true);
    }
});

contentForm.addEventListener('submit', async event => {
    event.preventDefault();
    saveButton.disabled = true;
    try {
        if (!matchesContentShape(defaultContent, draft)) {
            throw new Error('Some values do not match the website content structure. Check the content fields and list items.');
        }
        validateLinks(draft, 'content');
        if (draft.contact.emailHref !== `mailto:${draft.contact.email}`) {
            throw new Error('contact.emailHref must match contact.email (mailto:address).');
        }
        const serialized = JSON.stringify(draft);
        if (serialized.length > 850000) {
            throw new Error('This content is too large to save to Firestore. Reduce the size of the blog content or image URLs.');
        }

        await setDoc(doc(clients.db, 'siteContent', 'current'), {
            content: draft,
            updatedAt: serverTimestamp(),
            updatedBy: clients.auth.currentUser.email
        });
        showStatus('Saved and published. Refresh the website to see the updates.', false);
    } catch (error) {
        console.error('Website content could not be published.', error);
        showStatus(`Could not publish: ${error.message}`, true);
    } finally {
        saveButton.disabled = false;
    }
});

initializeAdmin();
