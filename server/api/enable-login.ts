import process from "node:process"

export default defineEventHandler(async () => {
  if (!process.env.G_CLIENT_ID) return { enable: false, url: "" }
  return {
    enable: true,
    url: `https://github.com/login/oauth/authorize?client_id=${process.env.G_CLIENT_ID}`,
  }
})
