import { describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { app } from '../src/server.js'

const MAX_MS = 2000

describe('GET /', () => {
    it(`responds 200 with expected body in under ${MAX_MS}ms`, async () => {
        const started = performance.now()
        const res = await request(app).get('/').expect(200)
        const elapsed = performance.now() - started

        expect(res.text).toBe('Hello World!')
        expect(elapsed).toBeLessThan(MAX_MS)
    })
})

describe('GET /user', () => {
    it(`return john doe user`, async () => {
        const user = await request(app).get('/user')
        expect(user.body.name).toMatch('John Doe')
    })
})