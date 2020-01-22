const fs = require("fs");

const requestHandler = (req, res) => {
    const url = req.url;
    const method = req.method;

    if (url === '/') {
        res.write('<html>');
        res.write('     <head><title>Enter Message</title></head>');
        res.write('     <body>');
        res.write('         <form action="/message" method="POST">');
        res.write('             <input type="test" name="message">');
        res.write('                 <button type="submit">Send</button>');
        res.write('             </input>');
        res.write('         </form>');
        res.write('     </body>');
        res.write('</html>');
        return res.end();
    }



    if (url === '/message' && method === 'POST') {
        const body = [];

        req.on('data', (chunk) => {
            console.log(chunk);
            body.push(chunk);
        });
        return req.on('end', () => {
            const parsedBody = Buffer.concat(body).toString();
            console.log(parsedBody);
            const message = parsedBody.split('=')[1];
            fs.writeFile("message.txt", message, (err) => {
                res.statusCode = 302;
                res.setHeader('Location', '/');
                return res.end();
            });
        });
    }

    //console.log(req.url, req.headers, req.method);
    res.setHeader('Content-type', "text/html");
    res.write('<html>');
    res.write('<head><title>My First Page</title></head>');
    res.write('<body><h1>Hello from my NodeJS server</h1></body>');
    res.write('</html>');
    res.end();
};

module.exports = {
    handler: requestHandler,
    text: 'hello from the other side'
};
// same code
// exports.handler = requestHandler;
// exports.text = 'hello from the other side';