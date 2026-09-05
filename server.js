const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const formidable = require('formidable');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const server = http.createServer((req,res) => {
    if (req.method === 'POST' && req.url === '/upload') {
        const form = formidable({
            uploadDir: uploadDir,
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error('Upload Parsing Error:', err);
                res.writeHead(400, { 'Content-Type': 'text/html' });
                return res.end(`<h2>Upload Error: ${err.message}</h2><br><a href="/">Go Back</a>`);
            }

            let uploadedFile = null;
            if (files.file) {
                uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
            }

            if (!uploadedFile || !uploadedFile.newFilename) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                return res.end('<h2>Error: Invalid file type or no file selected.</h2><br><a href="/">Go Back</a>');
            }

            const validTypes = /jpeg|jpg|png|gif|pdf|txt/;
            const ext = path.extname(uploadedFile.originalFilename).toLowerCase().replace('.', '');
            const mimetype = uploadedFile.mimetype || '';

            const isValidExt = validTypes.test(ext);
            const isValidMime = validTypes.test(mimetype);

            if (!isValidExt || !isValidMime) {
                // Delete invalid file saved to disk
                if (fs.existsSync(uploadedFile.filepath)) {
                    fs.unlinkSync(uploadedFile.filepath);
                }
                res.writeHead(400, { 'Content-Type': 'text/html' });
                return res.end('<h2>Error: Invalid file type! Only images, PDFs, and TXT files are allowed.</h2><br><a href="/">Go Back</a>');
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<h2>File uploaded successfully: ${uploadedFile.newFilename}</h2><br><a href="/">Go Back</a>`);
        });
        return;
    }
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

    fs.readFile(filePath, (err, content) => {
        if(err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html'});
                res.end('<h1>404 - File Not Found</h1>');            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            const contentType = mime.lookup(filePath) || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
