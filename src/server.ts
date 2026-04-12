import express from 'express'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()
const app = express()
const port = Number(process.env.PORT) || 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/user', (req, res) => {
  const user = {
    id: 1,
    name: 'John Doe',
    email: 'johndoe@gmail.com',
  }
  res.json(user)
})

const __filename = fileURLToPath(import.meta.url)
const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === __filename

if (isMainModule) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

export { app }