import express from 'express'
import type { Application, Request, Response } from 'express'
import cors from 'cors'

const app:Application = express()

app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173" //assuming frontend with vite is working on this port
}))


app.get("/", (req: Request,res:Response) => {
    res.status(200).json(
        {message: "You are connected to Dev Pulse API, Instructor!"}
    )
})

export default app;


