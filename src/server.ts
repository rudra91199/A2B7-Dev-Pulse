import app from "./app"
import config from "./config/config"
import { initDB } from "./db"

const Main = () => {
    try {
        initDB()
        app.listen(config.port,() => {
            console.log(`Dev pulse is running on ${config.port} port`)
        })
    } catch (error) {
        console.error("Server Start Error", error)
    }
}

Main()