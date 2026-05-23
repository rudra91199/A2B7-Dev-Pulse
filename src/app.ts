import express from 'express'
import type { Application, Request, Response } from 'express'
import cors from 'cors'
import globalErrorHandler from './middlewares/globalErrorHandler'
import { authRoute } from './modules/auth/auth.route'

const app:Application = express()

app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173" //assuming frontend with vite is working on this port
}))

app.use("/api/auth", authRoute);

app.get("/", (req: Request,res:Response) => {
    res.status(200).json(
        {message: "You are connected to Dev Pulse API, Instructor!"}
    )
})

app.use(globalErrorHandler)

export default app;


