import { useState } from "react"
import {
  Box, Button, Container, Grid, TextField, Typography, Card, CardContent, Divider
} from "@mui/material"
import { v4 as uuid } from "uuid"
import Log from "./logger"
import "./App.css"
import { useNavigate, BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom"

const generateShortCode = () => Math.random().toString(36).substring(2, 8)

const storage = {}

function ShortenerPage() {
  const [urls, setUrls] = useState([{ id: uuid(), longUrl: "", validity: "", shortcode: "" }])
  const [results, setResults] = useState([])
  const [error, setError] = useState("")

  const validateUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleChange = (id, field, value) => {
    setUrls((prev) =>
      prev.map((url) => (url.id === id ? { ...url, [field]: value } : url))
    )
  }

  const handleAdd = () => {
    if (urls.length < 5) {
      setUrls([...urls, { id: uuid(), longUrl: "", validity: "", shortcode: "" }])
    }
  }

  const handleShorten = () => {
    const newResults = []
    const now = new Date()
    setError("")

    for (let entry of urls) {
      const { longUrl, validity, shortcode } = entry
      if (!validateUrl(longUrl)) {
        setError("One or more URLs are invalid")
        Log("frontend", "error", "component", "invalid url format")
        return
      }

      const minutes = validity ? parseInt(validity) : 30
      if (isNaN(minutes) || minutes <= 0) {
        setError("Validity must be a positive integer")
        Log("frontend", "error", "component", "invalid validity period")
        return
      }

      let code = shortcode.trim() || generateShortCode()
      if (storage[code]) {
        setError(`Shortcode '${code}' already exists`)
        Log("frontend", "error", "component", "shortcode collision")
        return
      }

      const expireTime = new Date(now.getTime() + minutes * 60000)
      storage[code] = {
        longUrl,
        createdAt: now.toISOString(),
        expiresAt: expireTime.toISOString(),
        clicks: []
      }

      newResults.push({
        code,
        longUrl,
        shortUrl: `http://localhost:3000/${code}`,
        createdAt: now.toISOString(),
        expiresAt: expireTime.toISOString()
      })

      Log("frontend", "info", "component", `shortened ${longUrl} to ${code}`)
    }

    setResults(newResults)
  }

  return (
    <Container>
      <Typography variant="h4" className="title">URL Shortener</Typography>
      {urls.map((url) => (
        <Grid container spacing={2} key={url.id} className="url-block">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Long URL"
              value={url.longUrl}
              onChange={(e) => handleChange(url.id, "longUrl", e.target.value)}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Validity (min)"
              value={url.validity}
              onChange={(e) => handleChange(url.id, "validity", e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Custom Shortcode"
              value={url.shortcode}
              onChange={(e) => handleChange(url.id, "shortcode", e.target.value)}
            />
          </Grid>
        </Grid>
      ))}
      <Box className="buttons">
        <Button variant="outlined" onClick={handleAdd} disabled={urls.length >= 5}>Add URL</Button>
        <Button variant="contained" onClick={handleShorten}>Shorten</Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <Box mt={4}>
        {results.map((r) => (
          <Card key={r.code} className="result-card">
            <CardContent>
              <Typography><strong>Original:</strong> {r.longUrl}</Typography>
              <Typography><strong>Short:</strong> <a href={r.shortUrl}>{r.shortUrl}</a></Typography>
              <Typography><strong>Expires at:</strong> {r.expiresAt}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  )
}

function StatsPage() {
  const data = Object.entries(storage)
  return (
    <Container>
      <Typography variant="h4" className="title">Statistics</Typography>
      {data.map(([code, info]) => (
        <Card key={code} className="result-card">
          <CardContent>
            <Typography><strong>Short URL:</strong> http://localhost:3000/{code}</Typography>
            <Typography><strong>Original:</strong> {info.longUrl}</Typography>
            <Typography><strong>Created:</strong> {info.createdAt}</Typography>
            <Typography><strong>Expires:</strong> {info.expiresAt}</Typography>
            <Typography><strong>Clicks:</strong> {info.clicks.length}</Typography>
            <Divider sx={{ my: 1 }} />
            {info.clicks.map((c, i) => (
              <Typography key={i} fontSize="small">
                {c.time} — {c.source} — {c.location}
              </Typography>
            ))}
          </CardContent>
        </Card>
      ))}
    </Container>
  )
}

function Redirector() {
  const { code } = useParams()
  const navigate = useNavigate()

  if (storage[code]) {
    const now = new Date()
    const exp = new Date(storage[code].expiresAt)
    if (now > exp) {
      Log("frontend", "warn", "component", `expired link: ${code}`)
      navigate("/")
    } else {
      storage[code].clicks.push({
        time: now.toISOString(),
        source: document.referrer || "unknown",
        location: "IN"
      })
      Log("frontend", "info", "component", `redirected to ${storage[code].longUrl}`)
      window.location.href = storage[code].longUrl
    }
  } else {
    Log("frontend", "error", "component", `invalid code: ${code}`)
    navigate("/")
  }

  return null
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ShortenerPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/:code" element={<Redirector />} />
      </Routes>
    </Router>
  )
}
