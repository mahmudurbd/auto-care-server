import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("AutoCareDB");
const serviceCollection = database.collection("services");

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
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
