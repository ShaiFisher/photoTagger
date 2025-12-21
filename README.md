# photoTagger
Display and tag local photos in browser

The image gallery and tags are displayed in browser,<br>
while an HTTP server in NodeJS receives commands and handles the files.<br>
The tags are added to the file name.

Run:
1. npm install (first time only to install dependencies)

2. node photoTagger.js directory<br>
The server will build a list of the photos (to be used by the web app) and start an HTTP server on port 3000.

3. Open http://localhost:3000/photos.html in your browser

4. Tag photos<br>
Clicking the current photo will apply the tags.<br>
Additional commands: delete, rotate.<br>
