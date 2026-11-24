# Firebase setup

The public pages continue to show their built-in content until Firebase is configured. The admin editor stores one published content document in Firestore.

1. Open the existing Firebase project, `nazmul-hossen-shuvo`, in the Firebase console.
2. Register a Web app in Project settings and copy its `apiKey` and `appId` into `js/firebase-config.js`. Keep the existing project ID and auth domain. These web app identifiers are public; never put service-account keys or admin passwords in this file.
3. In Authentication, enable the Email/Password provider. Visit `/admin.html`, enter `nhtshuvo@gmail.com` and a strong password, then choose **Create the admin account**. Verify the email from the inbox, return to `/admin.html`, and sign in.
4. Create the Firestore database if it does not exist yet. Deploy the included rules with the Firebase CLI from this folder:

   ```text
   firebase deploy --only firestore:rules
   ```

   The rules allow public reads for the website content and permit writes only for the verified `nhtshuvo@gmail.com` account. Do not replace these with test mode rules.
5. Deploy the hosting changes:

   ```text
   firebase deploy --only hosting
   ```

After signing in, edit the fields in each section and choose **Save and publish**. Use **Add item** and **Remove** to manage skills, experience entries, FAQs, links, and blog posts. Set each post's thumbnail to an image URL or a site-relative image path. The homepage shows a thumbnail and headline for each post; clicking a card opens that article on the blog page. If Firestore is unavailable, the pages show their built-in content and report the load failure in the browser console.

To change the authorized admin email, update both `adminEmail` in `js/firebase-config.js` and the matching email in `firestore.rules`, then redeploy the rules.
