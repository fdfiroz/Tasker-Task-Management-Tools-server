const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const uri = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@tasker.yttqmf0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
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

const database = client.db("tasker");
const userCollection = database.collection("userCollection");
const taskCollection = database.collection("taskCollection");

app.post("/api/v1/auth/access-token", async (req, res) => {
  const body = req.body;
  //   jwt.sign("payload", "secretKey", "expireInfo");
  // user: abc@gmail.com
  const token = jwt.sign(body, process.env.ACCESS_TOKEN, { expiresIn: "10h" });
  const expirationDate = new Date(); // Create a new Date object
  expirationDate.setDate(expirationDate.getDate() + 365); // Set the expiration date to 365 days from the current date
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      expires: expirationDate,
    })
    .send({ massage: "success" });
});
//logout
app.post("/api/v1/auth/logout", async (req, res) => {
  try {
    const user = req.body;
    res.clearCookie("token", { maxAge: 0 }).send({ message: "success" });
  } catch {
    console.log(error);
  }
});

const verify = async (req, res, next) => {
  const token = req.cookies?.token;
  // console.log(token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
//add user info
app.post("/api/v1/user", async (req, res) => {
  const newUserInfo = req.body;
  const result = await userCollection.insertOne(newUserInfo);
  res.send(result);
});
//get user info by email

//update user info
// app.patch("/api/v1/user", async (req, res) => {
//   try{
//     const user = req.body;
//   console.log('updating user info: ', user);
//   const filter = { email: user.email }
//   const updateDoc = {
//       $set: {
//           uid: user.uid,
//           emailVerified: user.emailVerified,
//           lastSignInTime: user.lastSignInTime,
//           photoURL: user.photoURL,

//       }
//   }
//   const result = await userCollection.updateOne(filter, updateDoc );
//   res.send(result);
//   }
//   catch{
//     console.log(error)
//   }
// })
app.put("/api/v1/users", async (req, res) => {
  const user = req.body;
  console.log(user)
  const filter = { email: user.email };
  const updateDoc = {
    $set: {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      uid: user.uid,
      emailVerified: user.emailVerified,
      lastSignInTime: user.lastSignInTime,
      createdAt: user.createdAt,
    },
  };
  const result = await userCollection.updateOne(filter, updateDoc, {upsert: true});
  console.log(result)
  res.send(result);
});

//Start server
app.get("/", (req, res) => {
  res.send("Hello from Tasker Server.");
});

app.listen(port, () => {
  console.log(`Tasker is running on port ${port}`);
});
