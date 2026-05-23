import app from "./app";
import config from "./config/config";
import { initDB } from "./db";

const Main = () => {
  initDB();
  app.listen(config.port, () => {
    console.log(`Dev pulse is running on ${config.port} port`);
  });
};

Main();
