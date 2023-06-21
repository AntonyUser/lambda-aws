const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateItemCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

aapp.post("/visitors", async function (req, res) {
  const { visitorId, name } = req.body;
  if (typeof visitorId !== "string") {
    res.status(400).json({ error: '"visitorId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      visitorId: visitorId,
      name: name,
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    res.json({ visitorId, name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create visitor" });
  }
});

app.get("/visitors", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
  };

  try {
    const { Items } = await dynamoDbClient.send(new GetCommand(params));
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

app.get("/visitors/:visitorId", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      visitorId: req.params.visitorId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { visitorId, name } = Item;
      res.json({ visitorId, name });
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

app.patch("/visitors/:visitorId", async function (req, res) {
  const { visitorId } = req.params;
  const { newName } = req.body;
  if (typeof visitorId !== "string") {
    res.status(400).json({ error: '"visitorId" must be a string' });
  } else if (typeof newName !== "string") {
    res.status(400).json({ error: '"newName" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      visitorId: visitorId,
      name: newName,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new UpdateItemCommand(params));
    if (Item) {
      const { visitorId, name } = Item;
      res.json({ visitorId, name });
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

app.delete("/visitors/:visitorId", async function (req, res) {
  const { visitorId } = req.params;
  if (typeof visitorId !== "string") {
    res.status(400).json({ error: '"visitorId" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      visitorId: visitorId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));

    if (Item) {
      await dynamoDbClient.send(new DeleteCommand(params));
      res.status(200).json({ message: "Visitor deleted" });
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

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
