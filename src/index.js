const express = require('express');

//DB Connection
require('./db/mongoose');

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT || 3000;

//Parses incoming json to an object so we can access it in our request handler
app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log('Server is up on port : ' + port);
});

