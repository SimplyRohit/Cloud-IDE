//server/src/server.ts
import http from "http";
import chokidar from "chokidar";
import express from "express";
import { Server as SocketServer } from "socket.io";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import pty from "node-pty";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USER_DIR = path.join(process.cwd(), "user");
if (!fsSync.existsSync(USER_DIR)) {
  fsSync.mkdirSync(USER_DIR, { recursive: true });
}

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

app.use(express.json());
const ptyProcess = pty.spawn("bash", [], {
  name: "xterm-color",
  cwd: USER_DIR,
  env: process.env,
});

ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.post("/api/terminal", (req, res) => {
  const { data } = req.body;
  ptyProcess.write(data);
  res.sendStatus(200);
});

app.get("/health", (req, res) => {
  res.sendStatus(200).send("OK");
});

app.get("/files", async (req, res): Promise<any> => {
  try {
    const tree = await getFileListTree(USER_DIR);
    return res.json(tree);
  } catch (error) {
    console.error("Error fetching file tree:", error);
    res.status(500).send("Error fetching file tree");
  }
});

app.get("/files/:filePath", async (req, res) => {
  try {
    const { filePath } = req.params;
    const fileContent = await fs.readFile(
      path.join(USER_DIR, filePath),
      "utf-8"
    );
    res.json(fileContent);
  } catch (error) {
    console.error("Error fetching file content:", error);
    res.status(500).send("Error fetching file content");
  }
});

app.post("/files/:filePath", async (req, res) => {
  try {
    const { filePath } = req.params;
    const { content } = req.body;
    await fs.writeFile(
      path.join(USER_DIR, filePath),
      content,
      "utf-8"
    );
    res.status(200).send("File saved successfully");
  } catch (error) {
    console.error("Error saving file content:", error);
    res.status(500).send("Error saving file content");
  }
});

async function getFileListTree(dir: any) {
  const tree = {};

  async function treelist(curdir: any, currtree: any) {
    const files = await fs.readdir(curdir);
    await Promise.all(
      files.map(async (file) => {
        const filepath = path.join(curdir, file);
        const stat = await fs.stat(filepath);
        if (stat.isDirectory()) {
          currtree[file] = {};
          await treelist(filepath, currtree[file]);
        } else {
          currtree[file] = null;
        }
      })
    );
  }

  await treelist(dir, tree);
  return tree;
}

const watcher = chokidar.watch(USER_DIR, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
});

watcher.on("all", (event, path) => {
  console.log(`File ${event}: ${path}`);
  io.emit("file-change", { event, path });
});

server.listen(9000, () => {
  console.log("Server started on port 9000");
});
