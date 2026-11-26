const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/services/db.service");
const { initSocket } = require("./src/services/socket.service");

async function startServer() {
  await connectDB();
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
