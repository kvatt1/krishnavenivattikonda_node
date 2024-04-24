const http = require("http");
const file = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const PORT = 5959;

const dbConnection = async () => {
    const URL ='mongodb+srv://kvatt1:Kmongodb@cluster0.dxvit3l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(URL);
    try {
        /* Connects to MongoDB*/
        await client.connect();
        console.info("Database is connected succesfully!");
        /* Call for fetching medicine data*/
        const data = await getMedicinesData(client);
        const filePath = path.join(__dirname, "public", "db.json");
        file.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log("Data saved to db.json successfully.");
        return data;

    } catch (e) {
        console.error(`Error connecting in database : ${e}`);
    }
    finally {
        await client.close();
    }
}

const getMedicinesData = async (client) => {
    const cursor = await client.db("Pharmacy").collection("Medicines").find({});
    const medicinesList = await cursor.toArray();
    return medicinesList;
}

const errorPage = (response) => {
    file.readFile(path.join(__dirname, "public", "error.html"), (error, data) => {
        if (error) throw error;
        response.writeHead(200, "Success", { "content-type": "text/html" });
        response.write(data, "utf-8");
        response.end();
    });
}

const getContentType = (filePath)  =>{
    const contentTypeMap = {
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.html': 'text/html',
    };
    const extensionName = path.extname(filePath);
    return contentTypeMap[extensionName] || 'text/plain';
}

http.createServer(async (request, response) => {
    console.log(request.url);
    if (request.url === "/api") {
        console.log(request.url);
        try {
            const medicinesData = await dbConnection();
            console.log(JSON.stringify(medicinesData[0].medicines));
            response.setHeader("Access-Control-Allow-Origin", '*')           
            response.writeHead(200, "Success", { "content-type": "application/json" });
            response.write(JSON.stringify(medicinesData));
        }
        catch (error) {
            console.error("Error fetching items:", error);
            response.writeHead(500, { "content-type": "text/plain" });
            response.write("Internal Server Error");
        }
        finally {
            response.end();
        }
    }
    else {
        let filePath = path.join(__dirname, "public", request.url === '/' ? "index.html" : request.url);
        file.readFile(filePath, (error, data) => {
            if (error) {
                    error.code === "ENOENT" ? errorPage(response) : 
                    error.code === "EACCES" ? console.error("Permission denied!"): console.error(error);
            }
            else {
                const contentType = getContentType(filePath);
                response.writeHead(200, "Success", { "content-type": contentType });
                response.write(data, "utf-8");
                response.end();
            }
        });
    }
}).listen(PORT, () => console.info(`Server is running on port ${PORT}`));