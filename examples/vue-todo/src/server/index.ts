import express from "express"
import { api } from "./api"
import session from "cookie-session"
import { auth } from "./auth"
import helmet from "helmet"
import compression from "compression"
import path from "path"

const app = express()
app.use(
  session({
    secret: process.env["SESSION_SECRET"] || "my secret",
  })
)
app.use(helmet())
app.use(compression())
app.use(auth)
app.use(api)

app.use(express.static(path.join(__dirname, "../")))
app.get("/{*splat}", (_, res) => {
  res.sendFile(path.join(__dirname, "../", "index.html"))
})

app.listen(process.env["PORT"] || 3002, () => console.log("Server started"))
