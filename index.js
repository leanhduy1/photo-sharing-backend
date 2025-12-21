const express = require("express");
const session = require("express-session"); 
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AdminRouter = require("./routes/adminRouter"); 
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

dbConnect();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true  
}));

app.use(express.json());

app.use("/images", express.static("images"));

app.use(session({
    secret: process.env.SECRET_KEY,  
    resave: false,                    
    saveUninitialized: false,         
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,  
        httpOnly: true,               
        secure: false,                
        sameSite: 'lax'
    }
}));

app.use("/api/admin", AdminRouter);  
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);

app.get("/", (req, res) => {
    res.send({ message: "Hello from photo-sharing app API!" });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

app.listen(8081, () => {
    console.log("server listening on port 8081");
});