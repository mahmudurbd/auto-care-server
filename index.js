import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
// app.use(cors({ origin: ["http://localhost:5173/"], credentials: true }));
app.use(
  cors({
    origin: ["http://localhost:5173"], // The exact origin of your frontend
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// custom middlewares
const logger = async (req, res, next) => {
  console.log("called: ", req.host, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("verify token in the middleware", token);
  if (!token) {
    return res.status(401).send({ message: "Not Authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Not Authorized" });
    }
    console.log("value in the token", decoded);
    req.user = decoded;
    console.log("user", req.user);
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("AutoCareDB");
    const serviceCollection = database.collection("services");
    const bookingsCollection = database.collection("bookings");

    // Auth Service API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("token api is hitting", user);
      const token = jwt.sign({ data: user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          // sameSite: "None",
          // maxAge: 24 * 60 * 60 * 1000,
          // path: "/",
        })
        .send({ success: true });
    });

    // Services GET API
    app.get("/services", async (req, res) => {
      console.log("services get api is hitting");
      const services = serviceCollection.find();
      const result = await services.toArray();
      res.send(result);
    });

    // Service Details GET API
    app.get("/services/:id", async (req, res) => {
      console.log("Service Details api");
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // Booking GET API
    app.get("/bookings", logger, verifyToken, async (req, res) => {
      console.log("Booking get api hitting");

      if (req.query.email !== req.user.data.email) {
        return res.status(403).send({ message: "Forbidden" });
      }
      let query = {};
      if (req.query?.email) {
        query = {
          email: req.query.email,
        };
      }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    // Booking POST API
    app.post("/bookings", async (req, res) => {
      console.log("Bookings api hitting");
      const booking = req.body;
      console.log(booking);
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // Booking DELETE API
    app.delete("/bookings/:id", async (req, res) => {
      console.log("Booking Delete api hitting");
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello world!!!");
});

app.listen(port, () => {
  console.log(`Example app listening on ports ${port}`);
});
