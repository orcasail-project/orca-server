const express = require('express');
const config = require('config');
const router = require('./src/lib/router/router');
const cors = require('cors');

const app = express();
app.use(cors());
app.use("/", router);
const port = config.get("port") || 3000;

app.listen(port, () => {
  console.log(` run in port:${port} `);
});