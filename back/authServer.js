// Authenticate User
import express from "express"

const email = req.body.email
const user = { name: username }

const accessToken = generateAccessToken(user)
const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
res.json({ accessToken: accessToken })

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' })
}