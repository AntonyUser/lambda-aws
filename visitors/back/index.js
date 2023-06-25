const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));

const USERS_TABLE = process.env.USERS_TABLE;
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.post("/visitors", async function (req, res) {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    res.json({ userId, name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create visitor" });
  }
});

app.get("/visitors", async function (req, res) {
  console.log("Hi");
  const params = {
    TableName: USERS_TABLE,
  };

  try {
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    if (Items) {
      res.json({ Items });
    } else {
      res.status(404).json({ error: "Could not find visitors" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive visitor" });
  }
});

app.get("/visitors/:userId", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find visitor with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive visitor" });
  }
});

app.post("/visitors/:userId", async function (req, res) {
  const { userId } = req.params;
  const { newName } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof newName !== "string") {
    res.status(400).json({ error: '"newName" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
    },
    UpdateExpression: "set name = :newName",
    ExpressionAttributeValues: {
      ":newName": newName,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new UpdateItemCommand(params));

    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find visitor with provided "visitorId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive visitor" });
  }
});

app.delete("/visitors/:userId", async function (req, res) {
  const { userId } = req.params;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      await dynamoDbClient.send(new DeleteItemCommand(params));
      res.status(200).json({ message: "Visitor deleted" });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find visitor with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive visitor" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
