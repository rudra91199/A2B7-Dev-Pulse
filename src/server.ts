import app from "./app"
import config from "./config/config"

const Server = async () => {
    try {
        app.listen(config.port,() => {
            console.log(`Dev pulse is running on ${config.port} port`)
        })
    } catch (error) {
        console.error("Server Start Error", error)
    }
}

Server()